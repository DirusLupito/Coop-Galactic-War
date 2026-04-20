```js
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
```