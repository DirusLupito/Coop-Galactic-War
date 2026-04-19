var model;

$(document).ready(function () {

    function isGalacticWarForConnect(payload) {
        var serverGameType = payload
            && payload.data
            && payload.data.client
            && payload.data.client.game_options
            && payload.data.client.game_options.game_type;
        var reconnectGameType = model.reconnectToGameInfo() && model.reconnectToGameInfo().game;

        return serverGameType === 'Galactic War'
            || reconnectGameType === 'GalacticWar'
            || reconnectGameType === 'Galactic War';
    }

    var DEFAULT_CONNECTION_ATTEMPTS = 5;
    var DEFAULT_CONNECT_DELAY = 2;
    var DEFAULT_RETRY_DELAY = 5;

    function ConnectViewModel() {
        var self = this;

        self.displayName = ko.observable().extend({ session: 'displayName' });
        self.uberId = ko.observable().extend({ session: 'uberId' });

        // deprecated and no longer used
        self.joinLocalServer = ko.observable().extend({ session: 'join_local_server' });
        //

        self.serverType = ko.observable().extend({ session: 'game_server_type' });
        self.serverSetup = ko.observable().extend({ session: 'game_server_setup' });

        self.lobbyId = ko.observable().extend({ session: 'lobbyId' });
        self.gameTicket = ko.observable().extend({session: 'gameTicket' });
        self.gameHostname = ko.observable().extend({ session: 'gameHostname' });
        self.gamePort = ko.observable().extend({ session: 'gamePort' });
        self.uberNetRegion = ko.observable().extend({ local: 'uber_net_region' });

        self.gameContent = ko.observable().extend({ session: 'game_content' });
        self.isLocalGame = ko.observable().extend({ session: 'is_local_game' });
        self.gameType = ko.observable().extend({ session: 'game_type' });

        self.connectionAttempts = ko.observable(DEFAULT_CONNECTION_ATTEMPTS).extend({ session: 'connection_attempts' });
        self.connectionRetryDelaySeconds = ko.observable(DEFAULT_RETRY_DELAY).extend({ session: 'connection_retry_delay_seconds' })

        self.isPrivateGame = ko.observable().extend({ session: 'is_private_game' });
        self.privateGamePassword = ko.observable().extend({ session: 'private_game_password' });
        self.uuid = ko.observable('').extend({ session: 'invite_uuid' });

        self.ladderPlayerId = ko.observable('').extend({ session: 'ladder_player_id' });

        self.clientData = ko.computed(function () {
            var result = {
                password: self.privateGamePassword(),
                uberid: self.uberId(),
                uuid: self.uuid(),
            }
// include ticket only for uber servers
            if ( self.serverType() == 'uber' && self.gameType() != 'Ladder1v1' ) {
                result.ticket = self.gameTicket() || 'ticket';
            }
            return result;
        });

        self.gameModIdentifiers = ko.observableArray().extend({ session: 'game_mod_identifiers' });

        self.reconnectToGameInfo = ko.observable().extend({ local: 'reconnect_to_game_info' });
        self.reconnectingToExistingGame = ko.observable(false);

        self.gameInfo = ko.computed( function() {
            var result = {
                uberId: self.uberId(),
                lobby_id: self.lobbyId(),
                content: self.gameContent(),
                uuid: self.uuid(),
                game_hostname: self.gameHostname(),
                game_port: self.gamePort(),
                game_password: self.privateGamePassword(),
                local_game: self.isLocalGame(),
                type: self.serverType(),
                setup: self.serverSetup(),
                game: self.gameType(),
                mods: self.gameModIdentifiers(),
                timestamp: Date.now()
// excludes ticket
            };
            return result;
        });

        self.pageTitle = ko.observable();
        self.pageSubTitle = ko.observable();

        self.fail = function(primary, secondary)
        {
            self.reconnectToGameInfo(false);

            var connectFailDestination = ko.observable().extend({ session: 'connect_fail_destination' });

            var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
            var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
            var transitDestination = ko.observable().extend({ session: 'transit_destination' });
            var transitDelay = ko.observable().extend({ session: 'transit_delay' });

            transitPrimaryMessage(primary);
            transitSecondaryMessage(secondary || loc("!LOC:Returning to Main Menu"));
            transitDestination(connectFailDestination() || 'coui://ui/main/game/start/start.html');
            transitDelay(5000);
            window.location.href = 'coui://ui/main/game/transit/transit.html';
            return; /* window.location.href will not stop execution. */
        };

        self.connecting = ko.observable(false);
        self.cancelling = ko.observable(false);

        self.shouldRetry = function() {
            return !self.cancelling() && self.connectionAttemptsRemaining > 0;
        };

        self.showCancel = ko.observable(false);

        self.cancelTimer = false;

        self.enableCancel = function() {
            if (self.cancelTimer) {
                clearTimeout(self.cancelTimer);
                self.cancelTimer = false;
            }
            self.showCancel(true);
        }

        self.disableCancel = function() {
            self.showCancel(false);
            if (self.cancelTimer) {
                clearTimeout(self.cancelTimer);
                self.cancelTimer = false;
            }
        }
        self.cancel = function() {
            self.cancelling(true);
            self.showCancel(false);
            if (self.connecting()) {
                self.pageSubTitle('');
            } else {
                self.fail(loc("!LOC:CONNECTION TO SERVER CANCELED"));
            }
        }

        self.delayedConnectToGame = function(delay) {
            if (self.isLocalGame())
                self.pageTitle(loc("!LOC:CREATING WORLD SIMULATION"));
            else
                self.pageTitle(loc("!LOC:CONNECTING TO SERVER"));
            self.pageSubTitle('');
            _.delay(self.connectToGame, delay * 1000);
        }

        self.connectToGame = function()
        {
            if (self.connectionAttemptsRemaining != self.connectionAttempts())
                self.pageSubTitle(loc("!LOC:ATTEMPTS REMAINING: __num_attempts_remaining__", { num_attempts_remaining: self.connectionAttemptsRemaining }));
            else
                self.pageSubTitle('');
            self.connectionAttemptsRemaining--;
            self.connecting(true);
            return api.net.connect(
            {
                host: self.gameHostname(),
                port: self.gamePort(),
                displayName: self.displayName() || 'Player',
                ticket: self.gameTicket(),
                clientData: self.clientData(),
                content: self.gameContent(),
                lobby_id: self.lobbyId()
            });
        };

        self.retryConnection = function() {
            self.showCancel(!self.cancelling() && self.gameType() != 'Ladder1v1');
            _.delay(self.connectToGame, self.connectionRetryDelaySeconds() * 1000);
        };

        self.localServerRecommended = ko.observable().extend({ session: 'local_server_recommended' });
        self.offlineNotRecommendedDismissed = ko.observable(false).extend({ session: 'offline_not_recommended_warning_dismissed' });
        self.showOfflineNotRecommended = ko.pureComputed(function() { return self.isLocalGame() && !self.localServerRecommended() && !self.offlineNotRecommendedDismissed(); });
        self.dismissOfflineNotRecommended = function() { self.offlineNotRecommendedDismissed(true); };

        self.needsServerModsUpload = ko.observable(false);
        self.serverModsUploading = ko.observable(false);
        self.needsGwCampaignMod6Upload = ko.observable(false);
        self.gwCampaignMod6Uploading = ko.observable(false);
        self.redirectURL = ko.observable(undefined);

        self.uploadGwCampaignMod6ToServer = function(done) {
            var complete = _.isFunction(done) ? done : function() {};

            var resolveActiveClientMods = function(doneResolve, attempt) {
                var nextAttempt = _.isNumber(attempt) ? attempt : 0;
                var manager = window.CommunityModsManager;
                if (!manager) {
                    if (nextAttempt >= 100) {
                        console.log('[GW_COOP] connect_to_game mod6 upload unavailable: CommunityModsManager missing after wait');
                        doneResolve([]);
                        return;
                    }

                    _.delay(function() {
                        resolveActiveClientMods(doneResolve, nextAttempt + 1);
                    }, 100);
                    return;
                }

                try {
                    if (_.isFunction(manager.activeClientMods)) {
                        doneResolve(manager.activeClientMods() || []);
                        return;
                    }

                    if (_.isFunction(manager.activeClientZipMods)) {
                        doneResolve(manager.activeClientZipMods() || []);
                        return;
                    }
                }
                catch (e) {
                    console.log('[GW_COOP] connect_to_game mod6 upload unavailable: failed to read active client mods');
                }

                doneResolve([]);
            };

            resolveActiveClientMods(function(activeClientMods) {
                if (!_.isArray(activeClientMods))
                    activeClientMods = [];

            var targetIndices = [6, 7];

            var normalizePathKey = function(path) {
                if (!_.isString(path))
                    return '';

                if (path.length > 1 && path.charAt(path.length - 1) === '/')
                    return path.substring(0, path.length - 1);

                return path;
            };

            var listAsDirectory = function(path) {
                var listingDeferred = $.Deferred();
                if (!_.isString(path) || !path.length) {
                    listingDeferred.reject();
                    return listingDeferred.promise();
                }

                var slashPath = path.charAt(path.length - 1) === '/' ? path : path + '/';
                var noSlashPath = slashPath.length > 1 ? slashPath.substring(0, slashPath.length - 1) : slashPath;
                var candidatePaths = _.uniq([path, slashPath, noSlashPath]);
                var candidateIndex = 0;

                var tryNextCandidate = function() {
                    if (candidateIndex >= candidatePaths.length) {
                        listingDeferred.reject();
                        return;
                    }

                    var candidatePath = candidatePaths[candidateIndex];
                    candidateIndex += 1;

                    api.file.list(candidatePath, false).then(function(listing) {
                        if (!_.isArray(listing)) {
                            tryNextCandidate();
                            return;
                        }

                        // Some virtual roots can return a self-only listing for one variant
                        // (with or without trailing slash). Keep probing alternate variants.
                        var isSelfOnlyListing = listing.length === 1
                            && normalizePathKey(listing[0]) === normalizePathKey(candidatePath);
                        if (isSelfOnlyListing) {
                            tryNextCandidate();
                            return;
                        }

                        listingDeferred.resolve({
                            path: candidatePath,
                            listing: listing
                        });
                    }, function() {
                        tryNextCandidate();
                    });
                };

                tryNextCandidate();

                return listingDeferred.promise();
            };

            var recursiveListFiles = function(rootPath) {
                var deferred = $.Deferred();
                var pendingPaths = [rootPath];
                var rootKey = normalizePathKey(rootPath);
                var queuedPaths = {};
                var visitedDirectories = {};
                var visitedFiles = {};
                var files = [];

                queuedPaths[rootKey] = true;

                var enqueuePath = function(path) {
                    if (!_.isString(path) || !path.length)
                        return;

                    var key = normalizePathKey(path);
                    if (!key.length || queuedPaths[key])
                        return;

                    queuedPaths[key] = true;
                    pendingPaths.push(path);
                };

                var drain = function() {
                    if (!pendingPaths.length) {
                        deferred.resolve(files);
                        return;
                    }

                    var nextPath = pendingPaths.shift();
                    if (!_.isString(nextPath) || !nextPath.length) {
                        drain();
                        return;
                    }

                    listAsDirectory(nextPath).then(function(directoryResult) {
                        var directoryPath = directoryResult.path;
                        var listing = directoryResult.listing;
                        var directoryKey = normalizePathKey(directoryPath);

                        if (directoryKey === rootKey)
                            console.log('[GW_COOP] connect_to_game campaign mod root_list_ok root=' + rootPath + ' entries=' + listing.length);

                        if (visitedDirectories[directoryKey]) {
                            drain();
                            return;
                        }
                        visitedDirectories[directoryKey] = true;

                        _.forEach(listing, function(entryPath) {
                            if (!_.isString(entryPath) || !entryPath.length)
                                return;

                            if (entryPath.charAt(entryPath.length - 1) === '/') {
                                enqueuePath(entryPath);
                                return;
                            }

                            enqueuePath(entryPath);
                        });

                        drain();
                    }, function() {
                        var filePath = normalizePathKey(nextPath);
                        if (filePath === rootKey)
                            console.log('[GW_COOP] connect_to_game campaign mod root_list_failed root=' + rootPath + ' note=all_path_variants_failed');

                        if (filePath !== rootKey && !visitedFiles[filePath]) {
                            visitedFiles[filePath] = true;
                            files.push(filePath);
                        }
                        drain();
                    });
                };

                drain();
                return deferred.promise();
            };

            var isLikelyBinaryFilePath = function(path) {
                if (!_.isString(path) || !path.length)
                    return false;

                return /\.(png|jpg|jpeg|gif|webp|ico|papa|dds)$/i.test(path);
            };

            var arrayBufferToBinaryString = function(buffer) {
                if (!buffer)
                    return '';

                var bytes = new Uint8Array(buffer);
                var chunkSize = 0x8000;
                var chunks = [];
                var i;
                for (i = 0; i < bytes.length; i += chunkSize) {
                    var slice = bytes.subarray(i, Math.min(bytes.length, i + chunkSize));
                    var chars = new Array(slice.length);
                    var j;
                    for (j = 0; j < slice.length; j++)
                        chars[j] = String.fromCharCode(slice[j]);
                    chunks.push(chars.join(''));
                }

                return chunks.join('');
            };

            var loadFileAsString = function(filePath) {
                var deferred = $.Deferred();
                var fileUrl = 'coui:/' + filePath;
                var expectBinary = isLikelyBinaryFilePath(filePath);

                if (!expectBinary) {
                    $.get(fileUrl).done(function(raw) {
                        var rawText = raw;
                        if (!_.isString(rawText)) {
                            try {
                                rawText = JSON.stringify(raw);
                            }
                            catch (e) {
                                deferred.resolve({
                                    ok: true,
                                    data: '[unserializable non-string data]',
                                    binary: false,
                                    unserializable: true
                                });
                                return;
                            }
                        }

                        deferred.resolve({
                            ok: true,
                            data: rawText,
                            binary: false,
                            unserializable: false
                        });
                    }).fail(function() {
                        deferred.reject();
                    });

                    return deferred.promise();
                }

                try {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', fileUrl, true);
                    xhr.responseType = 'arraybuffer';
                    xhr.onload = function() {
                        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
                            try {
                                var binaryText = arrayBufferToBinaryString(xhr.response);
                                deferred.resolve({
                                    ok: true,
                                    data: binaryText,
                                    binary: true,
                                    unserializable: false
                                });
                            }
                            catch (e) {
                                deferred.reject();
                            }
                        }
                        else
                            deferred.reject();
                    };
                    xhr.onerror = function() {
                        deferred.reject();
                    };
                    xhr.send();
                }
                catch (e) {
                    deferred.reject();
                }

                return deferred.promise();
            };

                var uploadSingleMod = function(targetIndex, doneUpload) {
                    var done = _.isFunction(doneUpload) ? doneUpload : function() {};
                    var mod = activeClientMods[targetIndex];
                    if (!mod) {
                        console.log('[GW_COOP] connect_to_game campaign mod upload skipped: mod index ' + targetIndex + ' missing');
                        done(false);
                        return;
                    }

                    var mountPath = _.isString(mod.mountPath) ? mod.mountPath : '';
                    if (!mountPath.length) {
                        console.log('[GW_COOP] connect_to_game campaign mod upload skipped: mod index ' + targetIndex + ' mountPath missing');
                        done(false);
                        return;
                    }

                    if (mountPath.charAt(mountPath.length - 1) !== '/')
                        mountPath += '/';

                    var modPayload;
                    try {
                        modPayload = JSON.parse(JSON.stringify(mod));
                    }
                    catch (e) {
                        console.log('[GW_COOP] connect_to_game campaign mod upload skipped: mod index ' + targetIndex + ' metadata unserializable');
                        done(false);
                        return;
                    }

                    var finalizeSendWithFiles = function(filePaths) {
                    var MAX_PART_CHARS = 60000;
                    var files = _.isArray(filePaths) ? filePaths : [];
                    var totalFiles = files.length;
                    var sentParts = 0;
                    var missingFiles = 0;
                    var unserializableFiles = 0;

                    var topLevelCounts = {};
                    var outsideMountPathCount = 0;
                    _.forEach(files, function(path) {
                        var normalizedPath = normalizePathKey(path);
                        if (!normalizedPath.length)
                            return;

                        var relativePath = normalizedPath;
                        if (normalizedPath.indexOf(mountPath) === 0)
                            relativePath = normalizedPath.substring(mountPath.length);
                        else
                            outsideMountPathCount += 1;
                        if (relativePath.charAt(0) === '/')
                            relativePath = relativePath.substring(1);

                        var separatorIndex = relativePath.indexOf('/');
                        var topLevel = separatorIndex >= 0 ? relativePath.substring(0, separatorIndex) : relativePath;
                        if (!topLevel.length)
                            topLevel = '[root]';

                        topLevelCounts[topLevel] = (topLevelCounts[topLevel] || 0) + 1;
                    });

                    var topLevelSummary = _.map(_.keys(topLevelCounts).sort(), function(key) {
                        return key + ':' + topLevelCounts[key];
                    }).join(',');
                    var sampleFiles = _.take(files, 5).join('|');

                    var containsUi = _.some(files, function(path) {
                        var normalizedPath = normalizePathKey(path);
                        var relativePath = normalizedPath.indexOf(mountPath) === 0 ? normalizedPath.substring(mountPath.length) : normalizedPath;
                        return _.isString(relativePath) && relativePath.indexOf('ui/') === 0;
                    });
                    var containsImages = _.some(files, function(path) {
                        var normalizedPath = normalizePathKey(path);
                        var relativePath = normalizedPath.indexOf(mountPath) === 0 ? normalizedPath.substring(mountPath.length) : normalizedPath;
                        return _.isString(relativePath) && relativePath.indexOf('images/') === 0;
                    });

                    console.log('[GW_COOP] connect_to_game campaign mod index=' + targetIndex + ' discovered_files=' + totalFiles + ' mount_path=' + mountPath + ' contains_ui=' + containsUi + ' contains_images=' + containsImages + ' outside_mount_path_count=' + outsideMountPathCount + ' top_levels=' + topLevelSummary + ' sample_files=' + sampleFiles);

                    model.send_message('gw_campaign_client_mod_payload', {
                        index: targetIndex,
                        phase: 'begin',
                        reason: 'connect_to_game_host_startup',
                        timestamp: _.now(),
                        mod: modPayload,
                        mount_path: mountPath,
                        roots: ['*'],
                        root_path: mountPath,
                        file_count: totalFiles
                    });

                    var finishSend = function() {
                        model.send_message('gw_campaign_client_mod_payload', {
                            index: targetIndex,
                            phase: 'complete',
                            reason: 'connect_to_game_host_startup',
                            timestamp: _.now(),
                            file_count: totalFiles,
                            missing_file_count: missingFiles,
                            unserializable_file_count: unserializableFiles,
                            sent_part_count: sentParts
                        });

                        console.log('[GW_COOP] connect_to_game campaign mod upload complete index=' + targetIndex + ' file_count=' + totalFiles + ' missing=' + missingFiles + ' unserializable=' + unserializableFiles + ' parts=' + sentParts);
                        done(totalFiles > 0);
                    };

                    if (!totalFiles) {
                        finishSend();
                        return;
                    }

                    var cursor = 0;
                    var sendNextFile = function() {
                        if (cursor >= totalFiles) {
                            finishSend();
                            return;
                        }

                        var filePath = files[cursor];
                        cursor += 1;

                        loadFileAsString(filePath).done(function(loadResult) {
                        var rawText = loadResult && _.isString(loadResult.data) ? loadResult.data : '';
                        if (loadResult && loadResult.unserializable)
                            unserializableFiles += 1;

                        var transportText = rawText;
                        var transportEncoding = '';
                        if (loadResult && loadResult.binary) {
                            try {
                                transportText = btoa(rawText);
                                transportEncoding = 'base64';
                            }
                            catch (e) {
                                transportText = rawText;
                                transportEncoding = '';
                                console.warn('[GW_COOP] connect_to_game binary file encode failed file=' + filePath + ' reason=' + e);
                            }
                        }

                        if (loadResult && loadResult.binary) {
                            var pngSignature = 'n/a';
                            if (/\.png$/i.test(filePath) && rawText.length >= 8) {
                                pngSignature = [
                                    rawText.charCodeAt(0),
                                    rawText.charCodeAt(1),
                                    rawText.charCodeAt(2),
                                    rawText.charCodeAt(3),
                                    rawText.charCodeAt(4),
                                    rawText.charCodeAt(5),
                                    rawText.charCodeAt(6),
                                    rawText.charCodeAt(7)
                                ].join(',');
                            }
                            console.log('[GW_COOP] connect_to_game binary file read file=' + filePath + ' bytes=' + rawText.length + ' transport_encoding=' + (transportEncoding || 'raw') + ' transport_bytes=' + transportText.length + ' png_signature=' + pngSignature);
                        }

                        var partCount = Math.max(1, Math.ceil(transportText.length / MAX_PART_CHARS));
                        var partIndex;
                        for (partIndex = 0; partIndex < partCount; partIndex++) {
                            var startIndex = partIndex * MAX_PART_CHARS;
                            var endIndex = Math.min(transportText.length, startIndex + MAX_PART_CHARS);
                            model.send_message('gw_campaign_client_mod_payload', {
                                index: targetIndex,
                                phase: 'file_part',
                                file_path: filePath,
                                file_part_index: partIndex,
                                file_part_count: partCount,
                                file_encoding: transportEncoding,
                                file_binary: !!(loadResult && loadResult.binary),
                                data: transportText.substring(startIndex, endIndex)
                            });
                            sentParts += 1;
                        }
                        }).fail(function() {
                        missingFiles += 1;
                        model.send_message('gw_campaign_client_mod_payload', {
                            index: targetIndex,
                            phase: 'file_missing',
                            file_path: filePath
                        });
                        }).always(function() {
                            if (cursor % 25 === 0 || cursor === totalFiles)
                                console.log('[GW_COOP] connect_to_game campaign mod upload progress index=' + targetIndex + ' sent=' + cursor + '/' + totalFiles + ' parts=' + sentParts);

                            _.defer(sendNextFile);
                        });
                    };

                    sendNextFile();
                };

                    recursiveListFiles(mountPath).then(function(filePaths) {
                        var unique = {};
                        var allFilePaths = [];
                        _.forEach(filePaths || [], function(path) {
                            var normalizedPath = normalizePathKey(path);
                            if (!normalizedPath.length || unique[normalizedPath])
                                return;

                            unique[normalizedPath] = true;
                            allFilePaths.push(normalizedPath);
                        });

                        allFilePaths.sort();
                        finalizeSendWithFiles(allFilePaths);
                    }, function() {
                        console.log('[GW_COOP] connect_to_game campaign mod file listing failed index=' + targetIndex + ' mount_path=' + mountPath);
                        finalizeSendWithFiles([]);
                    });
                };

                var uploadCursor = 0;
                var uploadedAny = false;
                var modUploadSummaries = [];
                var uploadNextTarget = function() {
                    if (uploadCursor >= targetIndices.length) {
                        console.log('[GW_COOP] connect_to_game campaign mod upload summary uploaded_any=' + uploadedAny + ' targets=' + targetIndices.join(',') + ' results=' + modUploadSummaries.join('|'));
                        complete(uploadedAny);
                        return;
                    }

                    var targetIndex = targetIndices[uploadCursor];
                    uploadSingleMod(targetIndex, function(uploaded) {
                        uploadedAny = uploadedAny || !!uploaded;
                        modUploadSummaries.push(targetIndex + ':' + (uploaded ? 'uploaded' : 'skipped_or_empty'));
                        uploadCursor += 1;
                        _.defer(uploadNextTarget);
                    });
                };

                uploadNextTarget();
            });
        };

        self.setup = function () {

            console.log('connect_to_game ' + window.location.search );
            api.debug.log( JSON.stringify(self.gameInfo()));

            api.Panel.message('uberbar', 'lobby_info', undefined);
            api.Panel.message('uberbar', 'lobby_status', '');

            var action = $.url().param('action');
            var mode = $.url().param('mode') || 'Config';
            var requestedMode = mode;
            var content = $.url().param('content') || '';
            var replayid = $.url().param('replayid');
            var local = $.url().param('local') === 'true';
            var params = $.url().param('params');
            var loadpath = $.url().param('loadpath');
            var loadtime = $.url().attr().fragment;

            var start = action === 'start';

            // Reconnect flows that navigate to connect_to_game without explicit
            // URL params still need content mounted before api.net.connect.
            // Use saved reconnect context as fallback, and default GW reconnects
            // to PAExpansion1 when no content is explicitly provided.
            if (_.isEmpty(content)) {
                var reconnectInfo = self.reconnectToGameInfo() || {};
                if (_.isString(reconnectInfo.content) && reconnectInfo.content.length)
                    content = reconnectInfo.content;
                else if (reconnectInfo.game === 'GalacticWar' || reconnectInfo.game === 'Galactic War')
                    content = 'PAExpansion1';
            }

            if (loadtime) {
                loadpath = loadpath + "#" + loadtime;
            }

            self.gameContent(content);

            // local parameter overrides
            if (local) {
                self.isLocalGame(true);
                self.serverType('local');
            }
            else if (start) {
                self.isLocalGame(false);
                self.serverType('uber');
            }

            var serverType = self.serverType();
            var gameType = self.gameType();

// reset if not from Ladder1v1
            if (gameType != 'Ladder1v1') {
                self.connectionAttempts(DEFAULT_CONNECTION_ATTEMPTS);
                self.connectionRetryDelaySeconds(DEFAULT_RETRY_DELAY);
            }

            self.connectionAttemptsRemaining = self.connectionAttempts();

// server and game type should be set in all new builds with exception of old mods
// Ladder1v1 games are already joined
            var needsJoinGame = ( serverType == 'uber' && gameType != 'Ladder1v1' ) || ( ! serverType && ! local );

            if (mode && !_.isEmpty(self.gameContent()))
                mode = self.gameContent() + ':' + mode;

            self.needsGwCampaignMod6Upload(start && requestedMode === 'gw_campaign');

            var connectDelay = DEFAULT_CONNECT_DELAY;

            if (start) {
                model.pageTitle(loc("!LOC:STARTING GAME"));
                self.uuid(UberUtility.createHexUUIDString());

                var region = local ? 'Local' : (self.uberNetRegion() || "USCentral");

                var startCall;

                if (replayid !== undefined)
                    startCall = api.net.startReplay(region, mode, replayid);
                else if (loadpath !== undefined) {
 // increase connection attempts and retry delay when loading potentially big saved games
                    self.connectionAttemptsRemaining = 15;
                    self.connectionRetryDelaySeconds(10);
                    startCall = api.net.loadSave(region, mode, loadpath);
                }
                else {
                    if (!local)
                        connectDelay = 0;

                    var parsedParams = params ? JSON.parse(params) : {};
                    var disableUPNP = $.url().param('disable_upnp');
                    if (disableUPNP)
                        parsedParams['disable_upnp'] = true;

                    startCall = api.net.startGame(region, mode, parsedParams);
                    self.needsServerModsUpload(!window.gNoMods);
                }
                startCall.always(function(data) {

                    if (_.isString(data))
                    {
                        try
                        {
                            data = JSON.parse(data);
                        }
                        catch (e)
                        {
                            console.error(e);
                            console.error(data);
                            data = null;
                        }
                    }

                    if (data && data.ErrorCode) {
                        switch (data.ErrorCode) {
                            case 200: { self.fail('Selected region is not valid', 'Please contact support'); } break; /* Message: InvalidRegion */
                            case 201: { self.fail('Region at capacity ', 'Please try again later'); } break; /* Message: RegionAtCapacity */
                            case 202: { self.fail('Server failed to start', 'Please contact support'); } break; /* Message: ServerFailedToStart */
                            default: self.fail('Unknown PlayFab error ' + data.Message + ' (#' + data.ErrorCode + ')', 'Please contact support');
                        }
                        return;
                    } else if (!data || !data.ServerHostname || !data.ServerPort) {
                        if (replayid !== undefined)
                            self.fail(loc("!LOC:FAILED TO START REPLAY"));
                        else if (loadpath !== undefined)
                            self.fail(loc("!LOC:FAILED TO LOAD GAME"));
                        else
                            self.fail(loc("!LOC:FAILED TO START GAME"));
                        return;
                    }

                    self.gameTicket(data.Ticket);
                    self.gameHostname(data.ServerHostname);
                    self.gamePort(data.ServerPort);
                    self.lobbyId(data.LobbyID);
                    self.delayedConnectToGame(connectDelay);
                });
                startCall.fail(function(data) {
                    data = parse(data);
                    self.handleStartError(data);
                });
            } else if ( ! needsJoinGame && self.gameHostname() && self.gamePort()) {

// check for custom servers and manually started local servers
                if (serverType != 'uber' && gameType == 'Waiting' ) {
                    connectDelay = 0;
                    self.needsServerModsUpload(!window.gNoMods);
                }

                self.delayedConnectToGame(connectDelay);

            } else if ( needsJoinGame && self.lobbyId()) {
                // uber servers must resolve via lobbyId to obtain ticket
                self.pageTitle(loc('!LOC:CONNECTING TO SERVER'));
                self.pageSubTitle(loc('!LOC:REQUESTING PERMISSION'));

                self.cancelTimer = setTimeout(self.enableCancel, 10000);

                api.net.joinGame({lobbyId: self.lobbyId()}).done(function (data) {
                    self.isLocalGame(false);
                    self.gameTicket(data.Ticket);
                    self.gameHostname(data.ServerHostname);
                    self.gamePort(data.ServerPort);
                    self.delayedConnectToGame(0);
                }).fail(function (data) {
                    console.error("Unable to join game", self.lobbyId(), data);
                    self.fail(loc("!LOC:FAILED TO GET PERMISSION"));
                }).always(function() {
                    self.disableCancel();
                });
            }  else {
                console.error('failed to join game', self.gameHostname(), self.gamePort());
                self.fail(loc("!LOC:FAILED TO JOIN GAME"));
            }
        }
    }

    model = new ConnectViewModel();

    handlers = {};
    handlers.connection_failed = function (payload) {
        console.error('connection_failed');
        console.error(JSON.stringify(payload));
        model.connecting(false);
        if (model.shouldRetry())
            model.retryConnection();
        else
        {
            if (model.isLocalGame())
                model.fail(loc("!LOC:UNABLE TO ACCESS WORLD SIMULATION"));
            else
                model.fail(loc("!LOC:CONNECTION TO SERVER FAILED"));
        }
    };

    handlers.downloading_mod_data = function(payload) {
        api.debug.log('downloading_mod_data: ' + JSON.stringify(payload));
        if (_.size(payload) > 0) {

            var gameModIdentifiers = _.map(payload, 'identifier');
            model.gameModIdentifiers(gameModIdentifiers);
            model.pageSubTitle(loc('!LOC:DOWNLOADING SERVER MODS'));
        }
    }

    handlers.login_accepted = function (payload) {
        api.debug.log('login_accepted');
// set game info for invites and direct reconnects
        api.debug.log(JSON.stringify(_.omit(model.gameInfo(),'game_password')));
        model.connecting(false);
        model.showCancel(false);

        var previousReconnectToGameInfo = model.reconnectToGameInfo();
        var gameInfo = model.gameInfo();

        if (previousReconnectToGameInfo) {
            gameInfo.game = gameInfo.game || previousReconnectToGameInfo.game;
            gameInfo.setup = gameInfo.setup || previousReconnectToGameInfo.setup;
            gameInfo.mods = (gameInfo.mods && gameInfo.mods.length) ? gameInfo.mods : (previousReconnectToGameInfo.mods || []);
            gameInfo.content = gameInfo.content || previousReconnectToGameInfo.content;
        }

        model.reconnectingToExistingGame(!!previousReconnectToGameInfo
            && previousReconnectToGameInfo.lobby_id === gameInfo.lobby_id
            && previousReconnectToGameInfo.uberId === gameInfo.uberId
            && previousReconnectToGameInfo.uuid === gameInfo.uuid
            && previousReconnectToGameInfo.game_hostname === gameInfo.game_hostname
            && previousReconnectToGameInfo.game_port === gameInfo.game_port);

        model.reconnectToGameInfo(gameInfo);

// can't invite to localhost, replays or resumed games
        if (gameInfo.game_hostname == 'localhost' || gameInfo.setup == 'replay' || gameInfo.setup == 'loadsave') {
            gameInfo = undefined;
        }

        api.Panel.message('uberbar', 'lobby_info', gameInfo);
        api.Panel.message('uberbar', 'lobby_status', '');

        if (model.isLocalGame())
            model.pageTitle(loc("!LOC:ACCESSING WORLD SIMULATION"));
        else
            model.pageTitle(loc('!LOC:LOGIN ACCEPTED'));
        model.pageSubTitle('');
        app.hello(handlers.server_state, handlers.connection_disconnected);

        model.cancelTimer = setTimeout(model.enableCancel, 30000);
    };

    handlers.login_rejected = function (payload) {
        console.error('login_rejected');
        console.error(JSON.stringify(payload));
        model.connecting(false);
        if (model.shouldRetry())
            model.retryConnection();
        else
        {
            if (model.isLocalGame())
                model.fail(loc("!LOC:ACCESS TO WORLD SIMULATION DENIED"));
            else
                model.fail(loc("!LOC:LOGIN TO SERVER REJECTED"));
        }
    };

// will be called once server mods are uploaded

    handlers.mount_mod_file_data = function (payload) {

        if ( !model.serverModsUploading() ) {
            console.error('mount_mod_file_data when not uploading server mods');
            return;
        }

        api.debug.log("server mods uploaded... mounting: " + JSON.stringify(payload));

        if (payload && payload.length > 0) {
            model.pageSubTitle(loc('!LOC:REMOUNTING SERVER MODS'));
        }
        api.mods.mountModFileData().always(function() {
            api.debug.log("server mods mounted " + JSON.stringify(payload));
            model.serverModsUploading(false);
            window.location.href = model.redirectURL();
            return; /* window.location.href will not stop execution. */
       });
    }

    var GW_SYNCED_MOD_STATE_KEY = 'gw_campaign_synced_client_mod_state';
    var GW_SYNCED_SCENE_MODS_KEY = 'gw_campaign_synced_scene_mods';
    var GW_SYNCED_ICON_CACHE_BUSTER_KEY = 'gw_campaign_synced_icon_cache_buster';
    var GW_SYNCED_ICON_BASE64_MAP_KEY = 'gw_campaign_synced_icon_base64_map';
    var gwCampaignClientSyncRuntime = {
        mods: {},
        mounting: false,
        pending_mount: false,
        pending_redirect_url: ''
    };

    var isGwCampaignPlayUrl = function(url) {
        return _.isString(url)
            && url.indexOf('coui://ui/main/game/galactic_war/gw_play/gw_play.html') === 0;
    };

    var normalizeGwSyncedClientPath = function(path) {
        if (!_.isString(path) || !path.length)
            return '';

        var normalizedPath = path.replace(/\\/g, '/');
        if (normalizedPath.charAt(0) !== '/')
            normalizedPath = '/' + normalizedPath;

        if (normalizedPath.indexOf('/client_mods/') === 0) {
            var modNameSlashIndex = normalizedPath.indexOf('/', '/client_mods/'.length);
            if (modNameSlashIndex >= 0 && modNameSlashIndex + 1 < normalizedPath.length)
                normalizedPath = normalizedPath.substring(modNameSlashIndex);
        }

        return normalizedPath;
    };

    var decodeGwSyncedPayloadData = function(rawData, encoding) {
        var text = _.isString(rawData) ? rawData : '';
        var normalizedEncoding = _.isString(encoding) ? encoding.toLowerCase() : '';

        if (normalizedEncoding === 'base64') {
            try {
                return atob(text);
            }
            catch (e) {
                console.warn('[GW_COOP] connect_to_game failed to decode base64 synced payload reason=' + e);
                return '';
            }
        }

        return text;
    };

    var probeMountedIconUrl = function(url, label, reason) {
        if (!_.isString(url) || !url.length)
            return;

        var probeReason = _.isString(reason) && reason.length ? reason : 'unknown';
        var probeLabel = _.isString(label) && label.length ? label : 'unspecified';

        var imageProbe = new Image();
        imageProbe.onload = function() {
            console.log('[GW_COOP] connect_to_game icon_mount_probe image_ok label=' + probeLabel + ' reason=' + probeReason + ' width=' + imageProbe.naturalWidth + ' height=' + imageProbe.naturalHeight + ' url=' + url);
        };
        imageProbe.onerror = function() {
            console.log('[GW_COOP] connect_to_game icon_mount_probe image_error label=' + probeLabel + ' reason=' + probeReason + ' url=' + url);
        };
        imageProbe.src = url;

        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
                var status = _.isNumber(xhr.status) ? xhr.status : 0;
                var buffer = xhr.response;
                var byteLength = buffer && _.isNumber(buffer.byteLength) ? buffer.byteLength : 0;
                var pngSignature = 'n/a';
                if (buffer && byteLength >= 8) {
                    var bytes = new Uint8Array(buffer);
                    pngSignature = [
                        bytes[0],
                        bytes[1],
                        bytes[2],
                        bytes[3],
                        bytes[4],
                        bytes[5],
                        bytes[6],
                        bytes[7]
                    ].join(',');
                }

                console.log('[GW_COOP] connect_to_game icon_mount_probe xhr label=' + probeLabel + ' reason=' + probeReason + ' status=' + status + ' bytes=' + byteLength + ' png_signature=' + pngSignature + ' url=' + url);
            };
            xhr.onerror = function() {
                console.log('[GW_COOP] connect_to_game icon_mount_probe xhr_error label=' + probeLabel + ' reason=' + probeReason + ' url=' + url);
            };
            xhr.send();
        }
        catch (e) {
            console.log('[GW_COOP] connect_to_game icon_mount_probe xhr_exception label=' + probeLabel + ' reason=' + probeReason + ' err=' + e + ' url=' + url);
        }
    };

    var probeMountedIconPaths = function(normalizedIconPath, reason) {
        if (!_.isString(normalizedIconPath) || !normalizedIconPath.length)
            return;

        var seen = {};
        var pushPath = function(path, label) {
            if (!_.isString(path) || !path.length)
                return;

            var normalizedPath = path;
            if (normalizedPath.charAt(0) !== '/')
                normalizedPath = '/' + normalizedPath;

            var url = 'coui://' + normalizedPath.substring(1);
            if (seen[url])
                return;

            seen[url] = true;
            probeMountedIconUrl(url, label, reason);
        };

        pushPath(normalizedIconPath, 'normalized_ui_mods');

        if (normalizedIconPath.indexOf('/ui/mods/') === 0) {
            var remainder = normalizedIconPath.substring('/ui/mods/'.length);
            var modNameSeparator = remainder.indexOf('/');
            if (modNameSeparator >= 0 && modNameSeparator + 1 < remainder.length) {
                var modName = remainder.substring(0, modNameSeparator);
                var modRelativePath = remainder.substring(modNameSeparator + 1);

                pushPath('/mods/' + modName + '/' + modRelativePath, 'mods_alias');

                if (modRelativePath.indexOf('gw_play/img/') === 0)
                    pushPath('/ui/main/game/galactic_war/' + modRelativePath, 'gw_play_alias');
            }
        }
    };

    var normalizeGwSyncedSceneUrl = function(url, modState) {
        if (!_.isString(url) || !url.length)
            return {
                url: '',
                matched: false,
                remapped: false,
                original_path: '',
                resolved_path: ''
            };

        var normalizedUrl = url.replace(/\\/g, '/');
        if (normalizedUrl.indexOf('http://') === 0 || normalizedUrl.indexOf('https://') === 0) {
            return {
                url: normalizedUrl,
                matched: true,
                remapped: false,
                original_path: normalizedUrl,
                resolved_path: normalizedUrl
            };
        }

        var mountPath = modState && _.isString(modState.mount_path) ? modState.mount_path : '';
        var knownFileMap = {};
        var knownFiles = _.keys(modState && _.isObject(modState.file_paths) ? modState.file_paths : {});
        _.forEach(knownFiles, function(path) {
            var normalizedPath = normalizeGwSyncedClientPath(path);
            if (normalizedPath.length)
                knownFileMap[normalizedPath] = true;
        });

        var toPath = function(rawUrl) {
            if (!_.isString(rawUrl) || !rawUrl.length)
                return '';

            var value = rawUrl.replace(/\\/g, '/');
            if (value.indexOf('coui://') === 0)
                value = '/' + value.substring('coui://'.length);

            if (value.indexOf('/') !== 0) {
                var normalizedMountPath = _.isString(mountPath) ? mountPath.replace(/\\/g, '/') : '';
                if (normalizedMountPath.length) {
                    if (normalizedMountPath.charAt(0) !== '/')
                        normalizedMountPath = '/' + normalizedMountPath;
                    if (normalizedMountPath.charAt(normalizedMountPath.length - 1) !== '/')
                        normalizedMountPath += '/';
                    value = normalizedMountPath + value;
                }
                else
                    value = '/' + value;
            }

            return normalizeGwSyncedClientPath(value);
        };

        var originalPath = toPath(normalizedUrl);
        var candidatePaths = [];
        var addCandidate = function(path) {
            var normalizedPath = normalizeGwSyncedClientPath(path);
            if (!normalizedPath.length)
                return;

            if (candidatePaths.indexOf(normalizedPath) === -1)
                candidatePaths.push(normalizedPath);
        };

        addCandidate(originalPath);

        var relativePath = '';
        if (originalPath.indexOf('/ui/mods/') === 0) {
            var afterUiMods = originalPath.substring('/ui/mods/'.length);
            var modSlashIndex = afterUiMods.indexOf('/');
            if (modSlashIndex >= 0 && modSlashIndex + 1 < afterUiMods.length) {
                var modId = afterUiMods.substring(0, modSlashIndex);
                relativePath = afterUiMods.substring(modSlashIndex + 1);

                addCandidate('/mods/' + modId + '/' + relativePath);
                addCandidate('/ui/main/game/galactic_war/' + relativePath);
                addCandidate('/ui/main/game/' + relativePath);
                addCandidate('/' + relativePath);
            }
        }

        if (originalPath.indexOf('/mods/') === 0) {
            var afterMods = originalPath.substring('/mods/'.length);
            var modIdSlashIndex = afterMods.indexOf('/');
            if (modIdSlashIndex >= 0 && modIdSlashIndex + 1 < afterMods.length) {
                var relativeAfterMods = afterMods.substring(modIdSlashIndex + 1);
                addCandidate('/ui/main/game/galactic_war/' + relativeAfterMods);
                addCandidate('/ui/main/game/' + relativeAfterMods);
                addCandidate('/' + relativeAfterMods);

                if (!relativePath.length)
                    relativePath = relativeAfterMods;
            }
        }

        var resolvedPath = '';
        var matched = false;
        _.forEach(candidatePaths, function(candidate) {
            if (resolvedPath.length)
                return;

            if (knownFileMap[candidate]) {
                resolvedPath = candidate;
                matched = true;
            }
        });

        if (!resolvedPath.length && relativePath.length && knownFiles.length) {
            var suffix = '/' + relativePath;
            var suffixMatches = _.filter(knownFiles, function(filePath) {
                return _.isString(filePath) && filePath.length >= suffix.length && filePath.substring(filePath.length - suffix.length) === suffix;
            });

            if (suffixMatches.length > 1) {
                var preferredSuffixMatch = _.find(suffixMatches, function(filePath) {
                    return filePath.indexOf('/ui/main/game/galactic_war/') === 0;
                }) || _.find(suffixMatches, function(filePath) {
                    return filePath.indexOf('/ui/main/game/') === 0;
                });

                if (preferredSuffixMatch)
                    suffixMatches = [preferredSuffixMatch];
            }

            if (suffixMatches.length === 1) {
                resolvedPath = normalizeGwSyncedClientPath(suffixMatches[0]);
                matched = true;
            }
        }

        if (!resolvedPath.length)
            resolvedPath = originalPath;

        if (!resolvedPath.length) {
            return {
                url: '',
                matched: false,
                remapped: false,
                original_path: originalPath,
                resolved_path: resolvedPath
            };
        }

        return {
            url: 'coui://' + resolvedPath.substring(1),
            matched: matched,
            remapped: resolvedPath !== originalPath,
            original_path: originalPath,
            resolved_path: resolvedPath
        };
    };

    var readGwSyncedModState = function() {
        try {
            var raw = sessionStorage.getItem(GW_SYNCED_MOD_STATE_KEY);
            if (!raw)
                return { mods: {} };

            var parsed = JSON.parse(raw);
            if (!parsed || !_.isObject(parsed))
                return { mods: {} };

            if (!_.isObject(parsed.mods))
                parsed.mods = {};

            return parsed;
        }
        catch (e) {
            console.log('[GW_COOP] connect_to_game failed to parse synced mod state, resetting cache');
            return { mods: {} };
        }
    };

    var writeGwSyncedModState = function(state) {
        try {
            sessionStorage.setItem(GW_SYNCED_MOD_STATE_KEY, JSON.stringify(state || { mods: {} }));
        }
        catch (e) {
            console.log('[GW_COOP] connect_to_game failed to persist synced mod state');
        }
    };

    var rebuildGwSyncedSceneMods = function(state) {
        var sceneMods = {};
        var mods = state && _.isObject(state.mods) ? state.mods : {};
        var sceneUrlRemapCount = 0;
        var unresolvedSceneUrlCount = 0;
        var unresolvedSamples = [];

        _.forEach(mods, function(modState) {
            var mod = modState && _.isObject(modState.mod) ? modState.mod : null;
            if (!mod || !_.isObject(mod.scenes))
                return;

            _.forEach(mod.scenes, function(urls, scene) {
                if (!_.isString(scene) || !_.isArray(urls))
                    return;

                var existing = sceneMods[scene] || [];
                var normalizedUrls = _.chain(urls)
                    .map(function(url) {
                        var normalized = normalizeGwSyncedSceneUrl(url, modState);
                        if (normalized.remapped)
                            sceneUrlRemapCount += 1;

                        if (!normalized.matched && normalized.original_path.length) {
                            unresolvedSceneUrlCount += 1;
                            if (unresolvedSamples.length < 5)
                                unresolvedSamples.push((normalized.original_path || '[unknown]') + '->' + (normalized.resolved_path || '[missing]'));
                        }

                        return normalized.url;
                    })
                    .filter(function(url) {
                        return _.isString(url) && url.length;
                    })
                    .value();

                sceneMods[scene] = _.union(existing, normalizedUrls);
            });
        });

        try {
            sessionStorage.setItem(GW_SYNCED_SCENE_MODS_KEY, JSON.stringify(sceneMods));
        }
        catch (e) {
            console.log('[GW_COOP] connect_to_game failed to persist synced scene mods');
        }

        var sceneCount = _.keys(sceneMods).length;
        var gwLobbyCount = _.isArray(sceneMods.gw_lobby) ? sceneMods.gw_lobby.length : 0;
        var gwPlayCount = _.isArray(sceneMods.gw_play) ? sceneMods.gw_play.length : 0;
        var liveGameCount = _.isArray(sceneMods.live_game) ? sceneMods.live_game.length : 0;
        console.log('[GW_COOP] connect_to_game synced scene mods updated scenes=' + sceneCount + ' gw_lobby=' + gwLobbyCount + ' gw_play=' + gwPlayCount + ' live_game=' + liveGameCount + ' remapped_scene_urls=' + sceneUrlRemapCount + ' unresolved_scene_urls=' + unresolvedSceneUrlCount + ' unresolved_samples=' + (unresolvedSamples.length ? unresolvedSamples.join('|') : 'none'));
    };

    var getRuntimeModState = function(index) {
        var key = String(index);
        var modState = gwCampaignClientSyncRuntime.mods[key];
        if (!modState) {
            modState = {
                index: index,
                complete: false,
                files: {},
                file_parts: {},
                missing_files: [],
                mount_path: '',
                mod: null
            };
            gwCampaignClientSyncRuntime.mods[key] = modState;
        }
        return modState;
    };

    var allRuntimeModsComplete = function() {
        var keys = _.keys(gwCampaignClientSyncRuntime.mods || {});
        if (!keys.length)
            return false;

        return _.every(keys, function(key) {
            var modState = gwCampaignClientSyncRuntime.mods[key];
            return !!(modState && modState.complete);
        });
    };

    var collectRuntimeMountedFiles = function() {
        var files = {};
        _.forEach(gwCampaignClientSyncRuntime.mods, function(modState) {
            if (!modState || !modState.complete || !_.isObject(modState.files))
                return;

            _.forEach(modState.files, function(content, filePath) {
                if (!_.isString(filePath) || !filePath.length)
                    return;

                files[filePath] = _.isString(content) ? content : '';
            });
        });
        return files;
    };

    var tryFlushPendingGwCampaignRedirect = function() {
        var deferredUrl = gwCampaignClientSyncRuntime.pending_redirect_url;
        if (!deferredUrl || !deferredUrl.length)
            return;

        if (gwCampaignClientSyncRuntime.mounting || gwCampaignClientSyncRuntime.pending_mount)
            return;

        if (!allRuntimeModsComplete())
            return;

        gwCampaignClientSyncRuntime.pending_redirect_url = '';
        console.log('[GW_COOP] connect_to_game releasing deferred gw_campaign redirect url=' + deferredUrl);
        window.location.href = deferredUrl;
    };

    var processGwCampaignSyncMount = function(reason) {
        if (!gwCampaignClientSyncRuntime.pending_mount || gwCampaignClientSyncRuntime.mounting)
            return;

        gwCampaignClientSyncRuntime.pending_mount = false;

        var syncedFiles = collectRuntimeMountedFiles();
        var syncedFileKeys = _.keys(syncedFiles);
        if (!syncedFileKeys.length) {
            console.log('[GW_COOP] connect_to_game gw_campaign sync mount skipped no_files reason=' + (reason || 'unknown'));
            tryFlushPendingGwCampaignRedirect();
            return;
        }

        var gwPlayImageAliasCount = 0;
        var modsAliasCount = 0;
        _.forEach(syncedFileKeys, function(path) {
            if (!_.isString(path))
                return;

            var marker = '/ui/mods/';
            var markerIndex = path.indexOf(marker);
            if (markerIndex !== 0)
                return;

            var remainder = path.substring(marker.length);
            var modNameSeparator = remainder.indexOf('/');
            if (modNameSeparator < 0 || modNameSeparator + 1 >= remainder.length)
                return;

            var modName = remainder.substring(0, modNameSeparator);
            var modRelativePath = remainder.substring(modNameSeparator + 1);

            var modsAliasPath = '/mods/' + modName + '/' + modRelativePath;
            if (!_.has(syncedFiles, modsAliasPath)) {
                syncedFiles[modsAliasPath] = syncedFiles[path];
                modsAliasCount += 1;
            }

            if (modRelativePath.indexOf('gw_play/img/') !== 0)
                return;

            var aliasPath = '/ui/main/game/galactic_war/' + modRelativePath;
            if (!_.has(syncedFiles, aliasPath)) {
                syncedFiles[aliasPath] = syncedFiles[path];
                gwPlayImageAliasCount += 1;
            }
        });

        if (gwPlayImageAliasCount || modsAliasCount)
            syncedFileKeys = _.keys(syncedFiles);

        var syncedUiModsCount = _.filter(syncedFileKeys, function(path) {
            return _.isString(path) && path.indexOf('/ui/mods/') === 0;
        }).length;

        var hasValidPngSignature = function(value) {
            return _.isString(value)
                && value.length >= 8
                && value.charCodeAt(0) === 137
                && value.charCodeAt(1) === 80
                && value.charCodeAt(2) === 78
                && value.charCodeAt(3) === 71
                && value.charCodeAt(4) === 13
                && value.charCodeAt(5) === 10
                && value.charCodeAt(6) === 26
                && value.charCodeAt(7) === 10;
        };

        var syncedUiModsPngPaths = _.filter(syncedFileKeys, function(path) {
            return _.isString(path)
                && path.indexOf('/ui/mods/') === 0
                && /\.png$/i.test(path);
        });
        var validUiModsPngCount = _.filter(syncedUiModsPngPaths, function(path) {
            return hasValidPngSignature(syncedFiles[path]);
        }).length;
        var invalidUiModsPngSamples = _.take(_.filter(syncedUiModsPngPaths, function(path) {
            return !hasValidPngSignature(syncedFiles[path]);
        }), 5);

        var iconRawProbePath = '/client_mods/com.pa.quitch.gwaioverhaul/ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_storage_compression_upgrade.png';
        var iconNormalizedProbePath = normalizeGwSyncedClientPath(iconRawProbePath);
        var iconNormalizedPresent = _.has(syncedFiles, iconNormalizedProbePath);
        var iconRawPresent = _.has(syncedFiles, iconRawProbePath);
        var iconNormalizedData = iconNormalizedPresent ? syncedFiles[iconNormalizedProbePath] : '';
        var iconNormalizedLength = _.isString(iconNormalizedData) ? iconNormalizedData.length : 0;
        var iconNormalizedPngValid = iconNormalizedPresent ? hasValidPngSignature(iconNormalizedData) : false;

        var syncedIconBase64Map = {};
        _.forEach(syncedUiModsPngPaths, function(path) {
            if (!_.isString(path)
                || path.indexOf('/ui/mods/') !== 0
                || path.indexOf('/gw_play/img/tech/') < 0)
                return;

            var content = syncedFiles[path];
            if (!hasValidPngSignature(content))
                return;

            try {
                syncedIconBase64Map[path] = btoa(content);
            }
            catch (e) {
                console.warn('[GW_COOP] connect_to_game failed to base64 encode synced icon path=' + path + ' reason=' + e);
            }
        });
        var syncedIconBase64Count = _.keys(syncedIconBase64Map).length;

        var cookedFiles = _.mapValues(syncedFiles, function(value) {
            if (typeof value !== 'string')
                return JSON.stringify(value);
            return value;
        });

        gwCampaignClientSyncRuntime.mounting = true;
        console.log('[GW_COOP] connect_to_game gw_campaign sync mount begin files=' + syncedFileKeys.length + ' ui_mods_files=' + syncedUiModsCount + ' ui_mods_png_files=' + syncedUiModsPngPaths.length + ' ui_mods_png_valid=' + validUiModsPngCount + ' ui_mods_png_invalid_samples=' + (invalidUiModsPngSamples.length ? invalidUiModsPngSamples.join('|') : 'none') + ' gw_play_img_alias_count=' + gwPlayImageAliasCount + ' mods_alias_count=' + modsAliasCount + ' reason=' + (reason || 'unknown'));
        console.log('[GW_COOP] connect_to_game icon_probe phase=mount raw_key_present=' + iconRawPresent + ' normalized_key=' + iconNormalizedProbePath + ' normalized_key_present=' + iconNormalizedPresent + ' normalized_data_len=' + iconNormalizedLength + ' normalized_png_valid=' + iconNormalizedPngValid);

        api.file.mountMemoryFiles(cookedFiles).then(
            function() {
                try {
                    sessionStorage.setItem(GW_SYNCED_ICON_CACHE_BUSTER_KEY, String(_.now()));
                }
                catch (e) {
                    console.log('[GW_COOP] connect_to_game failed to persist icon cache buster');
                }

                try {
                    sessionStorage.setItem(GW_SYNCED_ICON_BASE64_MAP_KEY, JSON.stringify(syncedIconBase64Map));
                }
                catch (e) {
                    console.log('[GW_COOP] connect_to_game failed to persist synced icon base64 map');
                }

                probeMountedIconPaths(iconNormalizedProbePath, reason || 'unknown');
                console.log('[GW_COOP] connect_to_game persisted synced icon base64 entries=' + syncedIconBase64Count);
                console.log('[GW_COOP] connect_to_game gw_campaign sync mount complete files=' + syncedFileKeys.length + ' ui_mods_files=' + syncedUiModsCount);
            },
            function(err) {
                console.error('[GW_COOP] connect_to_game gw_campaign sync mount failed', err);
            }
        ).always(function() {
            gwCampaignClientSyncRuntime.mounting = false;
            if (gwCampaignClientSyncRuntime.pending_mount)
                _.defer(function() { processGwCampaignSyncMount('queued'); });
            else
                tryFlushPendingGwCampaignRedirect();
        });
    };

    var scheduleGwCampaignSyncMount = function(reason) {
        gwCampaignClientSyncRuntime.pending_mount = true;
        if (!gwCampaignClientSyncRuntime.mounting)
            processGwCampaignSyncMount(reason || 'scheduled');
    };

    handlers.gw_campaign_client_mod_sync = function(payload) {
        var data = payload || {};
        var phase = _.isString(data.phase) ? data.phase : 'unknown';
        var index = _.isNumber(data.index) ? data.index : -1;

        if (phase === 'begin') {
            var state = readGwSyncedModState();
            state.mods[index] = {
                index: index,
                mount_path: _.isString(data.mount_path) ? data.mount_path : '',
                mod: _.isObject(data.mod) ? _.cloneDeep(data.mod) : null,
                file_paths: {},
                complete: false,
                updated_at: _.now()
            };

            var runtimeModState = getRuntimeModState(index);
            runtimeModState.index = index;
            runtimeModState.complete = false;
            runtimeModState.files = {};
            runtimeModState.file_parts = {};
            runtimeModState.missing_files = [];
            runtimeModState.mount_path = _.isString(data.mount_path) ? data.mount_path : '';
            runtimeModState.mod = _.isObject(data.mod) ? _.cloneDeep(data.mod) : null;

            writeGwSyncedModState(state);
            rebuildGwSyncedSceneMods(state);

            var modScenes = data.mod && _.isObject(data.mod.scenes) ? _.keys(data.mod.scenes).sort() : [];
            console.log('[GW_COOP] connect_to_game gw_campaign_client_mod_sync begin index=' + index + ' mount_path=' + (data.mount_path || '') + ' scene_keys=' + (modScenes.length ? modScenes.join(',') : 'none'));
            return;
        }

        if (phase === 'complete') {
            var completeState = readGwSyncedModState();
            var completeIndex = index;
            var existingModState = completeState.mods[completeIndex] || {};
            existingModState.complete = true;
            existingModState.updated_at = _.now();
            completeState.mods[completeIndex] = existingModState;

            var runtimeCompleteModState = getRuntimeModState(completeIndex);
            runtimeCompleteModState.complete = true;

            writeGwSyncedModState(completeState);
            rebuildGwSyncedSceneMods(completeState);
            scheduleGwCampaignSyncMount('complete_index_' + completeIndex);

            var completeText;
            try {
                completeText = JSON.stringify(data);
            }
            catch (e) {
                completeText = '[unserializable]';
            }

            console.log('[GW_COOP] connect_to_game gw_campaign_client_mod_sync complete payload=' + completeText);
            return;
        }

        if (phase === 'file_missing') {
            var runtimeMissingModState = getRuntimeModState(index);
            var normalizedMissingPath = normalizeGwSyncedClientPath(data.file_path);
            if (normalizedMissingPath.length && runtimeMissingModState.missing_files.indexOf(normalizedMissingPath) === -1)
                runtimeMissingModState.missing_files.push(normalizedMissingPath);

            console.log('[GW_COOP] connect_to_game gw_campaign_client_mod_sync index=' + index + ' phase=file_missing file=' + (data.file_path || ''));
            return;
        }

        if (phase === 'file_part') {
            if (_.isNumber(index) && _.isString(data.file_path) && data.file_path.length) {
                var fileState = readGwSyncedModState();
                var fileModState = fileState.mods[index] || { index: index, file_paths: {} };
                if (!_.isObject(fileModState.file_paths))
                    fileModState.file_paths = {};

                var normalizedFilePath = normalizeGwSyncedClientPath(data.file_path);
                if (normalizedFilePath.length) {
                    if (!fileModState.file_paths[normalizedFilePath]) {
                        fileModState.file_paths[normalizedFilePath] = true;
                        fileModState.updated_at = _.now();
                        fileState.mods[index] = fileModState;
                        writeGwSyncedModState(fileState);
                    }
                }

                var runtimeFileModState = getRuntimeModState(index);
                if (!_.isObject(runtimeFileModState.file_parts))
                    runtimeFileModState.file_parts = {};
                if (!_.isObject(runtimeFileModState.files))
                    runtimeFileModState.files = {};

                var filePartIndex = _.isNumber(data.file_part_index) ? data.file_part_index : -1;
                var filePartCount = _.isNumber(data.file_part_count) ? data.file_part_count : 0;
                var filePartData = _.isString(data.data) ? data.data : '';
                var filePartEncoding = _.isString(data.file_encoding) ? data.file_encoding : '';
                if (normalizedFilePath.length && filePartIndex >= 0 && filePartCount > 0 && filePartIndex < filePartCount) {
                    var filePartState = runtimeFileModState.file_parts[normalizedFilePath];
                    if (!filePartState
                        || !_.isArray(filePartState.parts)
                        || filePartState.part_count !== filePartCount
                        || filePartState.file_encoding !== filePartEncoding) {
                        filePartState = {
                            part_count: filePartCount,
                            received_count: 0,
                            parts: new Array(filePartCount),
                            file_encoding: filePartEncoding
                        };
                        runtimeFileModState.file_parts[normalizedFilePath] = filePartState;
                    }

                    if (!_.isString(filePartState.parts[filePartIndex]))
                        filePartState.received_count += 1;

                    filePartState.parts[filePartIndex] = filePartData;

                    if (filePartState.received_count >= filePartState.part_count) {
                        var joinedData = filePartState.parts.join('');
                        runtimeFileModState.files[normalizedFilePath] = decodeGwSyncedPayloadData(joinedData, filePartState.file_encoding);
                        delete runtimeFileModState.file_parts[normalizedFilePath];
                    }
                }

                if (_.isString(data.file_path) && data.file_path.indexOf('gwc_storage_compression_upgrade.png') >= 0) {
                    console.log('[GW_COOP] connect_to_game icon_probe phase=file_part raw_file=' + data.file_path + ' normalized_file=' + normalizedFilePath + ' file_encoding=' + (filePartEncoding || 'raw') + ' part_data_len=' + filePartData.length + ' stored=' + _.has(runtimeFileModState.files, normalizedFilePath));
                }
            }

            console.log('[GW_COOP] connect_to_game gw_campaign_client_mod_sync index=' + data.index + ' phase=file_part file=' + data.file_path + ' part=' + data.file_part_index + '/' + data.file_part_count + ' data=' + (data.data || ''));
            return;
        }

        var payloadText;
        try {
            payloadText = JSON.stringify(data);
        }
        catch (e) {
            payloadText = '[unserializable]';
        }

        console.log('[GW_COOP] connect_to_game gw_campaign_client_mod_sync payload=' + payloadText);
    }

    handlers.server_state = function (payload) {

        var url = payload.url;

        if (url === 'coui://ui/main/game/live_game/live_game.html' && isGalacticWarForConnect(payload)) {
            var stagingUrl = 'coui://ui/main/game/gw_reconnect_loading/gw_reconnect_loading.html?target=' + encodeURIComponent(url);

            url = stagingUrl;
        }

// ignore server state messages not redirecting to a new scene

        if (url !== window.location.href) {

            model.redirectURL(url);

// if we are uploading server mods then ignore server state messages

            if (model.serverModsUploading()) {
                return;
            }

// if we are uploading gw campaign host mod data then ignore server state messages

            if (model.gwCampaignMod6Uploading()) {
                return;
            }

            if (isGwCampaignPlayUrl(url)) {
                var shouldDeferForSyncMount = gwCampaignClientSyncRuntime.mounting
                    || gwCampaignClientSyncRuntime.pending_mount
                    || (allRuntimeModsComplete() === false && _.keys(gwCampaignClientSyncRuntime.mods).length > 0);

                if (shouldDeferForSyncMount) {
                    gwCampaignClientSyncRuntime.pending_redirect_url = url;
                    console.log('[GW_COOP] connect_to_game deferring gw_campaign redirect until synced mount complete mods=' + _.keys(gwCampaignClientSyncRuntime.mods).length + ' mounting=' + gwCampaignClientSyncRuntime.mounting + ' pending_mount=' + gwCampaignClientSyncRuntime.pending_mount + ' all_complete=' + allRuntimeModsComplete());
                    return;
                }
            }

// if redirecting to gw campaign play as host, upload mod6 before redirect

            if (url == 'coui://ui/main/game/galactic_war/gw_play/gw_play.html?gw_campaign=1' && model.needsGwCampaignMod6Upload()) {

                model.needsGwCampaignMod6Upload(false);
                model.gwCampaignMod6Uploading(true);
                model.pageSubTitle(loc('!LOC:UPLOADING GW CO-OP MOD DATA... PLEASE WAIT'));

                model.uploadGwCampaignMod6ToServer(function() {
                    model.gwCampaignMod6Uploading(false);
                    window.location.href = url;
                    return; /* window.location.href will not stop execution. */
                });
                return;
            }

// if redirecting to new game lobby check if server mods needs uploading

            if (url == 'coui://ui/main/game/new_game/new_game.html' && model.needsServerModsUpload()) {

                model.needsServerModsUpload(false);
                model.serverModsUploading(true);

                if (model.gameModIdentifiers().length > 0) {
                    model.pageSubTitle(loc('!LOC:UPLOADING SERVER MODS... PLEASE WAIT'));
                }

// check if authorised to send mod data to server

                model.send_message('mod_data_available', {}, function (success, response) {

                    if (success) {
// upload the server mods
                       api.mods.sendModFileDataToServer(response.auth_token).then(function(data) {
                            api.debug.log('server mods uploaded');
                            api.debug.log(data);
                        });
                    } else {
// uploading of server mods is not allowed
                        window.location.href = url;
                        return; /* window.location.href will not stop execution. */
                   }
                });
            } else {
// not redirecting to new game lobby
                window.location.href = url;
                return; /* window.location.href will not stop execution. */
            }
        }

    };

    handlers.connection_disconnected = function (payload) {
        console.error('disconnected');
        console.error(JSON.stringify(payload));
        if (model.shouldRetry())
            model.retryConnection();
        else
        {
            if (model.isLocalGame())
                model.fail(loc('!LOC:WORLD SIMULATION WENT AWAY'));
            else
                model.fail(loc("!LOC:CONNECTION TO SERVER LOST"));
        }
    };

    handlers.player_id = function(payload)
    {
        model.ladderPlayerId(payload);
    }

    if ( window.CommunityMods ) {
        try {
            CommunityMods();
        } catch ( e ) {
            console.error( e );
        }
    }

    loadSceneMods('connect_to_game');

    // Activates knockout.js
    ko.applyBindings(model);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    model.setup();
});
