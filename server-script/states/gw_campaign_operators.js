var console = require('console'); // temporary workaround
var _ = require('thirdparty/lodash');

// Defines generic campaign operator architecture

// Galactic War co-op tries to keep host and viewer campaign state synchronized by sending small,
// deterministic operations instead of constantly sending the whole campaign save over. Vanilla co-op
// operators such as gw_campaign_action are host-authored: the host mutates its local campaign state,
// sends an action type plus operands to the server, and the server relays that action to viewers so
// their UI can replay the same mutation. That works well for built-in host actions, but mods need a
// way to define new operations without adding new server-script handler slop for each one.
//
// The generic operator relays below provide a mechanism for exactly that. They define a transport envelope,
// not gameplay semantics. The server only answers:
//
// 1. Who is allowed to send this kind of operator?
// 2. Is the envelope shaped like an operator?
// 3. Which connected client(s) should receive it?
//
// Everything else belongs to UI code. A mod chooses an operator type string, chooses what fields belong
// in payload, implements a handler function, and registers that handler on the game view model. The
// handler registration is what makes the control flow "jump back" into the mod:
//
//     model.registerCampaignViewerOperatorHandler(
//         'some_viewer_request_type',
//         function(operator) {
//             // Runs on the host when a viewer-originating operator of this type arrives.
//         }
//     );
//
//     model.registerCampaignHostOperatorHandler(
//         'some_host_result_type',
//         function(operator) {
//             // Runs on a viewer when a host-originating operator of this type arrives.
//         }
//     );
//
// There are two operator directions because the host is the authority on mutating campaign state,
// yet clients/viewers may still need to request that the host do something. Thus, we have two
// channel types: host-originating messages and viewer-originating messages:
//
// - gw_campaign_viewer_operator is viewer -> server -> host.
//   A non-host viewer sends a request to the host. The request itself should not mutate authoritative
//   campaign state on the viewer. The server rejects host senders on this channel, normalizes the
//   operator envelope, adds client_id/client_name for the requester, and relays it only to the host.
//   The host UI then dispatches it through gwCampaignViewerOperatorHandlers.
//
// - gw_campaign_host_operator is host -> server -> viewer(s).
//   The host sends an operator, acknowledgement, or result to viewers. The server rejects non-host
//   senders on this channel, normalizes the envelope, optionally resolves target_client_id or
//   target_client_ids, and relays it to the requested connected viewers or all viewers. The viewer UI
//   then dispatches it through gwCampaignHostOperatorHandlers.
//
// A typical request/result flow looks like this:
//
// 1. Viewer UI decides it needs the host to do something authoritative. For example, a GWO co-op player
//    clicks "Reroll Tech". The viewer sends:
//
//        model.sendCampaignViewerOperator('gwo_reroll_pending_tech', {
//            star: pendingTechCards.star,
//            deal_index: pendingTechCards.dealIndex
//        }, {
//            request_id: _.uniqueId('gwo_reroll_')
//        });
//
// 2. The server handles gw_campaign_viewer_operator here. It verifies the sender is not the host,
//    verifies the operator has a non-empty type string, adds the requester's client id/name, and sends
//    the same envelope to the host UI as message_type 'gw_campaign_viewer_operator'.
//
// 3. The host UI has:
//
//        handlers.gw_campaign_viewer_operator = function(payload) {
//            model.applyCampaignViewerOperator(payload || {});
//        };
//
//    applyCampaignViewerOperator calls applyCampaignOperator with gwCampaignViewerOperatorHandlers.
//    applyCampaignOperator looks up operatorHandlers[operator.type] and calls that function. If GWO
//    registered 'gwo_reroll_pending_tech', the handler that runs is GWO code, not server-script code.
//
// 4. The host-side handler validates the request against the host's campaign state, performs whatever
//    mutation is authoritative, and may then call sendCampaignHostOperator to send a result back. For a
//    private response it can include target_client_id: operator.client_id. For a shared mutation it can
//    broadcast to all viewers and set stale_snapshot: true if future snapshots must include the change.
//
// 5. Viewers receive message_type 'gw_campaign_host_operator'. Their UI dispatches through
//    gwCampaignHostOperatorHandlers using the same operator.type lookup. This can update local UI state,
//    apply a host-approved result, or log an error carried in the result payload.
//
// Important boundaries:
//
// - The server does not understand custom operator payloads. Payload validation belongs in the concrete
//   handler because only that handler knows what fields are meaningful.
//
// - Viewer-originating operators are requests, not authoritative statments. They should ask the host 
//   to do something, and the host should validate current campaign state before mutating anything.
//
// - Host-originating operators are still just relayed messages. If they represent campaign-state
//   changes that late-joining or reconnecting viewers need, the host should also ensure snapshots are
//   fresh enough, either by setting stale_snapshot when appropriate or by publishing a fresh snapshot.
//
// - request_id is just a correlation id so UI code can match a result to an in-progress request.
//
// - target_client_id/target_client_ids are only valid on the host -> viewer channel. Viewer -> host
//   operators always go to exactly one place: the current campaign host.
//
// The end result of this approach is that server-script code stays stable while UI mods can add new 
// operator types by registering handlers. The server is just a relay; the UI handler is the thing 
// that gives an operator meaning.

exports.installHelpers = function(self) {
    self.getCampaignHostClient = function() {
        return _.find(self.getConnectedClients(), function(client) {
            return client && client.id === self.creatorId;
        });
    };

    self.normalizeCampaignOperator = function(payload) {
        // Campaign operators are tiny, typed command envelopes that UI code can define and handle without
        // adding a new server-script message for every new behavior. The server treats the operator's type and
        // payload as opaque data; it validates only the envelope shape and then routes it to the proper client(s).
        //
        // An operator is expected to be of the form:
        // {
        //     type: 'string',       // Required. The operation name, and the key used by the receiving UI to look
        //                           // up a concrete handler. Example: 'gwo_reroll_pending_tech'. The server does
        //                           // not interpret this value beyond requiring a non-empty string.
        //
        //     payload: {},          // Optional. Operator-specific arguments. For a reroll request this might include
        //                           // the pending tech star and deal index; for another mod it could be any structured
        //                           // JSON-serializable data the sender and handler have agreed on. If omitted or not
        //                           // a plain object, the server normalizes it to {}. The server intentionally does not
        //                           // validate payload fields because it does not know the operator's semantics.
        //
        //     request_id: 'string', // Optional. A correlation token supplied by the UI. This is useful when a viewer
        //                           // asks the host to do something asynchronously and the host later sends a result
        //                           // back. The server preserves it but does not require it to be unique.
        //
        //     timestamp: number     // Optional. Sender-side timestamp, usually _.now(). This is useful for logs,
        //                           // debugging, or stale-response checks in UI code. If omitted, the server fills
        //                           // it with Date.now() so downstream handlers always have a timestamp-like value.
        // }
        //
        // Host-to-viewer operators may also include routing metadata on the original message:
        //
        // {
        //     target_client_id: id,      // Optional. Send the host operator only to one connected viewer.
        //     target_client_ids: [id],   // Optional. Send it only to these connected viewers.
        //     stale_snapshot: true       // Optional. Marks the cached campaign snapshot stale if this operator
        //                                // represents a campaign-state mutation that a later viewer may need in a
        //                                // full snapshot. Leave this false/omitted for request acknowledgements or
        //                                // private result messages that do not change shared campaign state.
        // }
        //
        // Viewer-originating operators receive sender metadata when they are relayed to the host:
        //
        // {
        //     client_id: id,        // Added by the server. Identifies the viewer that sent the request.
        //     client_name: 'name'   // Added by the server. Useful for lookup, logs, and targeted replies.
        // }

        if (!payload || !_.isString(payload.type) || !payload.type.length) {
            return undefined;
        }

        var operatorPayload = _.has(payload, 'payload') && _.isPlainObject(payload.payload)
            ? payload.payload
            : {};

        return {
            type: payload.type,
            payload: operatorPayload,
            request_id: payload.request_id,
            timestamp: _.isNumber(payload.timestamp) ? payload.timestamp : Date.now()
        };
    };

    self.getCampaignOperatorTargets = function(payload) {
        var explicitTargets = _.has(payload, 'target_client_id') || _.has(payload, 'target_client_ids');
        var connectedClients = self.getConnectedClients();

        if (!explicitTargets) {
            return {
                explicit: false,
                clients: _.filter(connectedClients, function(client) {
                    return client && client.id !== self.creatorId;
                })
            };
        }

        var targetIds = _.has(payload, 'target_client_ids') ? payload.target_client_ids : [payload.target_client_id];
        var requested = [];
        var requestedByKey = {};

        _.forEach(_.isArray(targetIds) ? targetIds : [targetIds], function(id) {
            if (_.isUndefined(id) || _.isNull(id)) {
                return;
            }

            var key = String(id);
            if (_.has(requestedByKey, key)) {
                return;
            }

            requestedByKey[key] = id;
            requested.push(id);
        });

        var targets = _.filter(connectedClients, function(client) {
            return client && client.id !== self.creatorId && _.has(requestedByKey, String(client.id));
        });

        var foundByKey = {};
        _.forEach(targets, function(client) {
            foundByKey[String(client.id)] = true;
        });

        var missing = _.filter(requested, function(id) {
            return !_.has(foundByKey, String(id));
        });

        return {
            explicit: true,
            requested: requested,
            missing: missing,
            clients: targets
        };
    };
};

exports.installHandlers = function(self, server, handlers) {
    handlers.gw_campaign_viewer_operator = function(msg) {
        if (msg.client.id === self.creatorId) {
            return server.respond(msg).fail('Host cannot publish viewer campaign operators');
        }

        var operator = self.normalizeCampaignOperator(msg.payload || {});
        if (!operator) {
            return server.respond(msg).fail('Invalid viewer campaign operator');
        }

        var host = self.getCampaignHostClient();
        if (!host || !host.connected) {
            return server.respond(msg).fail('No connected campaign host');
        }

        var relayPayload = _.assign({}, operator, {
            client_id: msg.client.id,
            client_name: msg.client.name
        });

        console.log('[GW COOP] gw_campaign_viewer_operator type=' + operator.type + ' from=' + msg.client.name + ' id=' + msg.client.id);
        host.message({
            message_type: 'gw_campaign_viewer_operator',
            payload: relayPayload
        });

        server.respond(msg).succeed({ sent: true });
    };

    handlers.gw_campaign_host_operator = function(msg) {
        if (msg.client.id !== self.creatorId) {
            return server.respond(msg).fail('Only host can publish host campaign operators');
        }

        var payload = msg.payload || {};
        var operator = self.normalizeCampaignOperator(payload);
        if (!operator) {
            return server.respond(msg).fail('Invalid host campaign operator');
        }

        var targets = self.getCampaignOperatorTargets(payload);
        if (targets.explicit && !targets.requested.length) {
            return server.respond(msg).fail('No target campaign clients requested');
        }
        if (targets.explicit && targets.requested.length && !targets.clients.length) {
            return server.respond(msg).fail('Target campaign client is not connected');
        }

        if (payload.stale_snapshot === true) {
            self.lastSnapshotStale = true;
        }

        var hostRelayPayload = _.assign({}, operator, {
            host_id: msg.client.id,
            host_name: msg.client.name
        });

        console.log('[GW COOP] gw_campaign_host_operator type=' + operator.type + ' from host=' + msg.client.name + ' targets=' + targets.clients.length + ' missing_targets=' + JSON.stringify(targets.missing || []));
        _.forEach(targets.clients, function(client) {
            client.message({
                message_type: 'gw_campaign_host_operator',
                payload: hostRelayPayload
            });
        });

        server.respond(msg).succeed({
            sent_count: targets.clients.length,
            missing_target_client_ids: targets.missing || []
        });
    };
};
