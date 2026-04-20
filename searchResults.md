# Mod Transport Term Search Results (client executable code)

Scope note: these results are from this workspace only (client executable source). If server/browser scripts or other engine modules live in another repo/window, they are not included here.

## Terms requested

- sendModFileDataToServer
- mountModFileData
- downloadModsFromServer
- mod_data_available
- mod_data_updated
- mod_data_received
- mount_mod_file_data
- getMods
- mounted_mods
- auth_token
- /server_mods/

## Not found in this workspace

The following requested terms had no matches in this client codebase:

- downloadModsFromServer
- mod_data_available
- mod_data_updated
- mount_mod_file_data

## Found snippets

### 1) JS/Coherent event bindings exposed by client executable

File: client_game.cpp:2384

```cpp
ProbedEventHandler::wrapAndBind(view, "mods.getMountedMods", Coherent::UI::MakeHandler(this, &ClientGame::modsGetMountedMods));
ProbedEventHandler::wrapAndBind(view, "mods.publishServerMods", Coherent::UI::MakeHandler(this, &ClientGame::modsPublishServerMods));
ProbedEventHandler::wrapAndBind(view, "mods.sendModFileDataToServer", Coherent::UI::MakeHandler(this, &ClientGame::modsSendModFileDataToServer));
ProbedEventHandler::wrapAndBind(view, "mods.mountModFileData", Coherent::UI::MakeHandler(this, &ClientGame::modsMountModFileData));
```

Why this matters: confirms the exact UI->engine hook names for send/mount/get mounted mods.

### 2) Public API declarations and auth token storage

File: client_game.h:770

```cpp
// mods
std::string modsGetMountedMods(std::string const & context, bool raw);
void modsPublishServerMods();
void modsSendModFileDataToServer(std::string const & auth_token);
void modsMountModFileData();
```

File: client_game.h:327

```cpp
std::string mModUpdateAuthToken;
```

Why this matters: shows auth token is persisted client-side between calls.

### 3) Send-side implementation: auth_token gate and network send

File: client_game.cpp:5854

```cpp
void ClientGame::modsSendModFileDataToServer(std::string const& auth_token)
{
	// if the incoming auth token is blank, we'll use the one we already have
	if (!auth_token.empty())
	{
		mModUpdateAuthToken = auth_token;
	}
	if (mModUpdateAuthToken.empty())
	{
		ZU_Error << "modsSendModFileDataToServer: Unable to send mod file data (No auth token)";
		return;
	}

	if (!mConnectionToServer)
	{
		ZU_Error << "modsSendModFileDataToServer: Unable to send mod file data (No connection)";
		return;
	}

	if (mServerLoadedRemoteModCollection != nullptr)
	{
		ModFileDataPackageBundleAuthorized bundle_auth(mModUpdateAuthToken, mServerLoadedRemoteModCollection->getDataPackageBundle());

		mConnectionToServer->sendModFileData(bundle_auth, mServerLoadedRemoteModCollection->getEstimatedSize());
	}
}
```

Why this matters: confirms auth token is required for send and that engine wraps bundle with authorization.

### 4) Receive-side implementation and ack message type

File: client_game.cpp:3537

```cpp
void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
{
	auto modCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle, "server");
	if (modCollection != nullptr)
	{
		mServerLoadedRemoteModCollection = modCollection;

		// we mount as soon as we download the bundle
		mountServerMods();

		platform()->getUIThreadTaskQueue()->enqueue(
			[=]()
			{
				Json data(Json::makeObject());
				data.set("message_type", Json::makeString("mod_data_received"));
				Json payload(Json::makeObject());
				// payload.set("auth_token", Json::makeString(auth_token));
				data.set("payload", payload);

				connSendMessage(data.asString());
			});
	}
}
```

Why this matters: explicit match for mod_data_received plus mount-on-download behavior.

### 5) mountModFileData path and server-mod update signal

File: client_game.cpp:5881

```cpp
void ClientGame::modsMountModFileData()
{
	mountServerMods();
}
```

File: client_game.cpp:5887

```cpp
void ClientGame::mountServerMods()
{
	auto mfs = platform()->getFilesystem()->isMemoryFilesystem();
	if (mfs)
	{
		if (mServerMountedRemoteModCollection)
		{
			mServerMountedRemoteModCollection->unmount();
			for (auto&& zipMount : mMountedZips) mfs->mountZipFile(zipMount.first, zipMount.second);
		}

		mServerMountedRemoteModCollection = mServerLoadedRemoteModCollection ? mServerLoadedRemoteModCollection->mountToMemoryFilesystem(mfs) : nullptr;

		setUnitSpecTag("");
		refreshFileSystem();
		mUIBridge->sendUISignal("server_mod_info_updated", UIBridge::MessageDelivery::Reliable);
	}
	else
	{
		ZU_Error << "ClientGame::mountServerMods: Platform Filesystem is not a MemoryFilesystem; memory files are not supported";
	}
}
```

Why this matters: shows mount target is memory filesystem and emits server_mod_info_updated.

### 6) Server mods republish/update path calls send with cached token

File: client_game.cpp:5913

```cpp
void ClientGame::serverModsUpdated()
{
	if (mServerLoadedLocalModCollection != nullptr)
	{
		mServerLoadedRemoteModCollection = mServerLoadedLocalModCollection->makeRemoteModCollection(platform()->getFilesystem(), mCompressServerMods);

		ZU_Info << "Mounted " << mServerLoadedRemoteModCollection->getMods().size() << " of " << mServerLoadedLocalModCollection->getMods().size()
				<< " loaded filesystem server mods";

		if (mConnectionToServer)
		{
			modsSendModFileDataToServer("");  // use existing auth token
		}
	}
	else
	{
		mServerLoadedRemoteModCollection = nullptr;
	}

	if (mUIBridge) mUIBridge->updateCachedUnitSpecs();
}
```

Why this matters: send path can be triggered from mod refresh without a new token argument.

### 7) mounted_mods payload generation and getMods usage

File: client_game.cpp:5820

```cpp
std::string ClientGame::modsGetMountedMods(std::string const& context, bool raw)
{
	Json data(Json::makeObject());

	bool serverOnly = string_equals_nocase(context, "server");
	bool clientOnly = string_equals_nocase(context, "client");

	modutil::ModCollection const* mods = nullptr;
	if (serverOnly && mServerMountedRemoteModCollection != nullptr)
		mods = mServerMountedRemoteModCollection.get();
	else if (clientOnly && mClientMountedModCollection != nullptr)
		mods = mClientMountedModCollection.get();

	Json mounted_mods;
	if (mods)
	{
		if (raw)
		{
			mounted_mods = Json::makeArray();
			auto&& modInfos = mods->getMods();
			for (auto&& modInfo : modInfos) mounted_mods.push_back(modInfo->raw);
		}
		else
			mounted_mods = mods->getModsJsonArray();
	}
	else
		mounted_mods = Json::makeArray();

	data.set("mounted_mods", mounted_mods);

	return data.asString();
}
```

Why this matters: direct evidence for requested terms mounted_mods and getMods, including raw/json paths.

### 8) /server_mods/ filesystem roots

File: client_game.cpp:991

```cpp
// server mods
{
	std::vector<std::string> server_mod_base_paths;
	std::string user_server_mod_base_path("/server_mods/");

	server_mod_base_paths.push_back("/stock_mods/server/");      // stock mods folder
	server_mod_base_paths.push_back(user_server_mod_base_path);  // user mods folder

	mServerLoadedLocalModCollection = modutil::LoadedLocalModCollection::loadLocalModCollection(platform()->getFilesystem(), server_mod_base_paths,
																								path::join(user_server_mod_base_path, "mods.json"), "server");

	serverModsUpdated();
}
```

File: client_game.cpp:7270

```cpp
std::string user_server_mod_base_path(path::join(platform()->getUserDataDir(), "server_mods"));
fs->mount(user_server_mod_base_path, "/server_mods/");
```

Why this matters: confirms both virtual mount point (/server_mods/) and user-data backing path setup.

---

# Mod Transport Term Search Results (server executable + pasted engine code)

Scope note: these results are from this workspace only, focused on server executable code paths (`server_main.cpp`, `libs/server/*`, `script/*`, and pasted `engine/*` and `lib/*` files). The existing sections above are client-side notes copied in earlier; this section adds server-side verification.

## Term status in this server workspace

Found (exact or close equivalent):

- `downloadModsFromServer`
- `mod_data_available`
- `mod_data_updated`
- `mod_data_received`
- `mount_mod_file_data`
- `getMods`
- `mounted_mods`
- `auth_token`
- `mountModFileData` close equivalent via `loadAndMountModFileData`

Not found (exact string):

- `sendModFileDataToServer`
- `mountModFileData`
- `/server_mods/`

## Found snippets

### 1) Server JS bridge exposes `downloadModsFromServer` and `getMods`

File: libs/server/server_module.cpp:95

```cpp
clientTemplate->SetAccessor(String::NewFromUtf8(isolate, "downloadModsFromServer").ToLocalChecked(), &ServerModule::js_client_get_downloadModsFromServer, nullptr, External::New(isolate, this));
...
server->Set(context, String::NewFromUtf8(isolate, "getMods").ToLocalChecked(), wrapMemberFunction(&ServerModule::js_getMods)).Check();
```

Why this matters: confirms the server executable exposes both client download and server mod-query entrypoints to scripts.

### 2) `downloadModsFromServer` sends mounted bundle from server to client

File: libs/server/server_module.cpp:465

```cpp
void ServerModule::js_client_downloadModsFromServer(v8::FunctionCallbackInfo<v8::Value> const & info)
{
	auto self = getSelf(info.Data());
	auto client = self->mClients->getElementSelf(info.This());
	if (!client || !client->connection)
		return;

	client->connection->sendModFileData(self->mHost->getServer()->getMountedModsDataPackageBundle(), self->mHost->getServer()->getMountedModsDataPackageBundleEstimatedSize());
}
```

Why this matters: this is the concrete server-side send path for mod bundle data in this workspace.

### 3) `getMods` payload includes `auth_token` and `mounted_mods`

File: libs/server/server_module.cpp:766

```cpp
void ServerModule::js_getMods(v8::FunctionCallbackInfo<v8::Value> const & info)
{
	...
	Json json(Json::makeObject());
	json.set("auth_token", Json::makeString(server->getModUpdateAuthToken()));

	auto modsJsonArray = self->mHost->getServer()->getMountedModsJsonArray();
	if (!modsJsonArray.isNull())
	{
		json.set("mounted_mods", modsJsonArray);
	}
	...
}
```

Why this matters: confirms exact key names used by script state handlers.

### 4) Server receives mod data and emits `mod_data_updated` with `auth_token`

File: server_main.cpp:2345

```cpp
std::string check_auth_token = bundle_auth.auth_token;

if (mGameServer->loadAndMountModFileData(bundle_auth))
{
	Json data(Json::makeObject());
	data.set("message_type", Json::makeString("mod_data_updated"));
	Json payload(Json::makeObject());
	payload.set("auth_token", Json::makeString(check_auth_token));
	data.set("payload", payload);
	...
}
```

Why this matters: this ties successful server-side mount/update to the script-visible `mod_data_updated` message.

### 5) Auth token gate for mount path (`loadAndMountModFileData`)

File: libs/server/game_server.cpp:4398

```cpp
bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
{
	...
	auto expected_auth_token = mModUpdateAuthToken;
	auto const & check_auth_token = bundle_auth.auth_token;
	if (!expected_auth_token.empty())
	{
		if (!string_equals(expected_auth_token, check_auth_token))
		{
			authorized = false;
		}
	}
	...
}
```

Why this matters: server-side authorization is enforced before mounting remote mod data.

### 6) Script-side `mod_data_available` uses `server.getMods()` and returns `auth_token`

File: script/states/lobby.js:2087

```javascript
var auth_token = "";
var hasMods = false;
var mods = server.getMods();
if (mods !== undefined)
{
	auth_token = mods.auth_token || "";
	if (mods.mounted_mods !== undefined && mods.mounted_mods.length > 0) {
		hasMods = true;
	}
}
...
response.succeed({ "auth_token": auth_token });
```

Why this matters: this is the handshake entry for requesting/validating mod updates in lobby flow.

### 7) Script handlers register `mod_data_available` and `mod_data_updated`

File: script/states/lobby.js:2377

```javascript
mod_data_available: playerMsg_modDataAvailable,
mod_data_updated: playerMsg_modDataUpdated,
```

Why this matters: confirms both message types are wired in the lobby server state.

### 8) `mount_mod_file_data` dispatch and `downloadModsFromServer` fanout

File: script/states/lobby.js:2158

```javascript
if (client.id !== msg.client.id)
{
	client.message({
		message_type: 'downloading_mod_data',
		payload: mods
	});
	client.downloadModsFromServer();
}
else
{
	client.message({
		message_type: 'mount_mod_file_data',
		payload: mods
	});
}
```

Why this matters: this is the direct script-side fork between remote download and local mount signal.

### 9) `mod_data_received` tracking and handler registration

File: script/states/load_save.js:48

```javascript
var mod_data_received = {
	/* client.id : bool */
}
...
mod_data_received[msg.client.id] = true;
```

File: script/states/load_save.js:382

```javascript
mod_data_received: playerMsg_ModDataReceived,
```

Why this matters: load/save flow explicitly waits for mod data receipt acknowledgment per client.

### 10) Playing-state update path also uses `downloadModsFromServer`/`mount_mod_file_data`

File: script/states/playing_shared.js:16

```javascript
if (client.id !== msg.client.id) {
	client.downloadModsFromServer();
} else {
	client.message({
		message_type: 'mount_mod_file_data',
		payload: {}
	});
}
```

File: script/states/playing_shared.js:463

```javascript
mod_data_updated: main.cheats.cheat_flags.allow_mod_data_updates && playerMsg_modDataUpdated,
```

Why this matters: confirms another non-lobby path where updated mod data can propagate.

### 11) `auth_token` schema in pasted engine proto

File: engine/crom/mod_file_data_package_bundle_authorized.uberproto:5

```proto
struct ModFileDataPackageBundleAuthorized
{
	string auth_token;
	ModFileDataPackageBundle bundle;
}
```

Why this matters: validates on-wire structure used by server upload/mount path.

### 12) `getMods` abstraction in mod utilities

File: engine/crom/mod_util.h:65

```cpp
virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const = 0;
virtual zu::Json getModsJsonArray() const = 0;
```

Why this matters: shows shared engine interface behind collection enumeration and JSON construction.

### 13) Server helper extracts only `mounted_mods` payload for outbound use

File: script/server_utils.js:194

```javascript
server.getModsPayload = function() {
	var mods = server.getMods();

	if (mods && mods.mounted_mods) {
		mods = mods.mounted_mods;
	} else {
		mods = undefined;
	}
	return mods;
}
```

Why this matters: script call sites often send only `mounted_mods`, not the full object with `auth_token`.

## Not found notes

- `sendModFileDataToServer` does not appear in this server workspace; the analogous server-side operation is `client.downloadModsFromServer()` -> `sendModFileData(...)`.
- `mountModFileData` exact camel-case string is not present; server-side equivalent naming is `loadAndMountModFileData`.
- `/server_mods/` exact path literal is not present in the server executable files in this workspace.

