# Engine Mod Transport Targeted Search Results
Generated: 2026-04-19 22:08:21

Scope: C/C++ files under engine/, libs/, client/, server/ (.cpp/.cc/.cxx/.h/.hpp)
Per hit includes: file+line, nearest signature, and 20 lines before/after.

## Term: LoadedLocalModCollection::loadLocalModCollection
- Hits: 5

### .\client\client_game.cpp:978
- Signature: L963: void ClientGame::initMods()
```cpp
    958 |     clearClientViews();
    959 | 
    960 |     mConsoleLogSink.reset();
    961 | }
    962 | 
    963 | void ClientGame::initMods()
    964 | {
    965 |     ZU_Info << "Init mods";
    966 | 
    967 |     // client mods
    968 |     {
    969 |         std::vector<std::string> client_mod_base_paths;
    970 |         std::string user_client_mod_base_path("/client_mods/");
    971 | 
    972 |         client_mod_base_paths.push_back("/stock_mods/client/");      // stock mods folder
    973 |         client_mod_base_paths.push_back(user_client_mod_base_path);  // user mods folder
    974 | 
    975 |         auto fs = platform()->getFilesystem();
    976 | 
    977 |         auto loadedClientModCollection =
>   978 |             modutil::LoadedLocalModCollection::loadLocalModCollection(fs, client_mod_base_paths, path::join(user_client_mod_base_path, "mods.json"), "client");
    979 |         if (loadedClientModCollection != nullptr)
    980 |         {
    981 |             mClientMountedModCollection = loadedClientModCollection->mountToFilesystem(fs);
    982 | 
    983 |             if (mClientMountedModCollection != nullptr)
    984 |             {
    985 |                 ZU_Info << "Mounted " << mClientMountedModCollection->getMods().size() << " of " << loadedClientModCollection->getMods().size() << " loaded filesystem client mods";
    986 |             }
    987 |         }
    988 |     }
    989 | 
    990 |     // server mods
    991 |     {
    992 |         std::vector<std::string> server_mod_base_paths;
    993 |         std::string user_server_mod_base_path("/server_mods/");
    994 | 
    995 |         server_mod_base_paths.push_back("/stock_mods/server/");      // stock mods folder
    996 |         server_mod_base_paths.push_back(user_server_mod_base_path);  // user mods folder
    997 | 
    998 |         mServerLoadedLocalModCollection = modutil::LoadedLocalModCollection::loadLocalModCollection(platform()->getFilesystem(), server_mod_base_paths,
```

### .\client\client_game.cpp:998
- Signature: L963: void ClientGame::initMods()
```cpp
    978 |             modutil::LoadedLocalModCollection::loadLocalModCollection(fs, client_mod_base_paths, path::join(user_client_mod_base_path, "mods.json"), "client");
    979 |         if (loadedClientModCollection != nullptr)
    980 |         {
    981 |             mClientMountedModCollection = loadedClientModCollection->mountToFilesystem(fs);
    982 | 
    983 |             if (mClientMountedModCollection != nullptr)
    984 |             {
    985 |                 ZU_Info << "Mounted " << mClientMountedModCollection->getMods().size() << " of " << loadedClientModCollection->getMods().size() << " loaded filesystem client mods";
    986 |             }
    987 |         }
    988 |     }
    989 | 
    990 |     // server mods
    991 |     {
    992 |         std::vector<std::string> server_mod_base_paths;
    993 |         std::string user_server_mod_base_path("/server_mods/");
    994 | 
    995 |         server_mod_base_paths.push_back("/stock_mods/server/");      // stock mods folder
    996 |         server_mod_base_paths.push_back(user_server_mod_base_path);  // user mods folder
    997 | 
>   998 |         mServerLoadedLocalModCollection = modutil::LoadedLocalModCollection::loadLocalModCollection(platform()->getFilesystem(), server_mod_base_paths,
    999 |                                                                                                     path::join(user_server_mod_base_path, "mods.json"), "server");
   1000 | 
   1001 |         serverModsUpdated();
   1002 |     }
   1003 | }
   1004 | 
   1005 | void ClientGame::launchPage(std::string const& url)
   1006 | {
   1007 |     platform()->openBrowser(url, Platform::URLRestrictions::OnlyAllowHTTPSchemas);
   1008 | }
   1009 | 
   1010 | void ClientGame::launchYouTubePage(std::string const& videoId)
   1011 | {
   1012 |     launchPage("http://www.youtube.com/watch?v=" + videoId);
   1013 | }
   1014 | 
   1015 | void ClientGame::launchRetrievePasswordPage()
   1016 | {
   1017 |     launchPage("https://service.planetaryannihilation.net/user/recoveraccountdialog");
   1018 | }
```

### .\engine\crom\mod_util.cpp:286
- Signature: L286: std::shared_ptr<LoadedLocalModCollection> LoadedLocalModCollection::loadLocalModCollection(zu::RefNoCount<crom::Filesystem> fs, std::vector<std::string> const & mod_base_dir_paths, zu::StringRange info_file_path, zu::StringRange expected_context)
```cpp
    266 | //        ZU_Info << "Loading mod : " << modName;
    267 |         if (!parseModInfoJson(json, result))
    268 |             return nullptr;
    269 | 
    270 |         if (!string_equals_nocase(result->context_string, expected_context))
    271 |         {
    272 |             ZU_Info << "    : skipping due to unsupported context; found \"" << result->context_string << "\", expected \"" << expected_context << "\"";
    273 |             return nullptr;
    274 |         }
    275 |     }
    276 |     catch (std::exception & e)
    277 |     {
    278 |         ZU_Error << "Failed to read " << configFileName << " file for " << modName;
    279 |         ZU_Error << e.what();
    280 |         return nullptr;
    281 |     }
    282 | 
    283 |     return result;
    284 | }
    285 | 
>   286 | std::shared_ptr<LoadedLocalModCollection> LoadedLocalModCollection::loadLocalModCollection(zu::RefNoCount<crom::Filesystem> fs, std::vector<std::string> const & mod_base_dir_paths, zu::StringRange info_file_path, zu::StringRange expected_context)
    287 | {
    288 |     std::shared_ptr<LoadedLocalModCollectionImpl> result(new LoadedLocalModCollectionImpl);
    289 | 
    290 |     for (auto const & mod_base_dir_path : mod_base_dir_paths)
    291 |     {
    292 |         result->mModBaseDirSystemPaths.push_back(mod_base_dir_path);
    293 | 
    294 |         std::vector<FileInfo> files;
    295 |         if (fs->listDir(mod_base_dir_path, files, ListDirRecurse::No))
    296 |         {
    297 |             for (auto & file : files )
    298 |             {
    299 |                 if (file.type != FT_Directory)
    300 |                     continue;
    301 | 
    302 |                 auto loadedMod = LoadedLocalModCollectionImpl::loadLocalMod(fs, file.name, expected_context);
    303 |                 if (loadedMod != nullptr)
    304 |                 {
    305 |                     size_t index = result->mMods.size();
    306 |                     result->mMods.push_back(loadedMod);
```

### .\engine\crom\mod_util.cpp:318
- Signature: L286: std::shared_ptr<LoadedLocalModCollection> LoadedLocalModCollection::loadLocalModCollection(zu::RefNoCount<crom::Filesystem> fs, std::vector<std::string> const & mod_base_dir_paths, zu::StringRange info_file_path, zu::StringRange expected_context)
```cpp
    298 |             {
    299 |                 if (file.type != FT_Directory)
    300 |                     continue;
    301 | 
    302 |                 auto loadedMod = LoadedLocalModCollectionImpl::loadLocalMod(fs, file.name, expected_context);
    303 |                 if (loadedMod != nullptr)
    304 |                 {
    305 |                     size_t index = result->mMods.size();
    306 |                     result->mMods.push_back(loadedMod);
    307 | 
    308 |                     auto inserted = result->mModInfoIdentifierToModIndexMap.insert(std::make_pair(loadedMod->identifier, index));
    309 |                     if (!inserted.second)
    310 |                     {
    311 |                         ZU_Error << "Cannot load mod " << file.name << "with identifier \"" << loadedMod->identifier << "\", a mod with that identifier already exists";
    312 |                     }
    313 |                 }
    314 |             }
    315 |         }
    316 |         else
    317 |         {
>   318 |             ZU_Info << "LoadedLocalModCollection::loadLocalModCollection: Failed listDir call for \"" << mod_base_dir_path << "\"; no mods will be loaded from this path";
    319 |         }
    320 |     }
    321 | 
    322 |     if (!result->mModInfoIdentifierToModIndexMap.empty())
    323 |     {
    324 |         auto infoFile = fs->open(info_file_path);
    325 | 
    326 |         if (!infoFile)
    327 |         {
    328 |             ZU_Warn << "LoadedLocalModCollection::loadLocalModCollection: Could not open " << info_file_path << " file; mods will not be mounted";
    329 |         }
    330 |         else
    331 |         {
    332 |             try
    333 |             {
    334 |                 FileStream config(infoFile.get());
    335 |                 auto json = Json::readFrom(config);
    336 |                 if (!json.isObject())
    337 |                 {
    338 |                     ZU_Error << "   : mod config requires a valid json object at the root";
```

### .\engine\crom\mod_util.cpp:328
- Signature: L286: std::shared_ptr<LoadedLocalModCollection> LoadedLocalModCollection::loadLocalModCollection(zu::RefNoCount<crom::Filesystem> fs, std::vector<std::string> const & mod_base_dir_paths, zu::StringRange info_file_path, zu::StringRange expected_context)
```cpp
    308 |                     auto inserted = result->mModInfoIdentifierToModIndexMap.insert(std::make_pair(loadedMod->identifier, index));
    309 |                     if (!inserted.second)
    310 |                     {
    311 |                         ZU_Error << "Cannot load mod " << file.name << "with identifier \"" << loadedMod->identifier << "\", a mod with that identifier already exists";
    312 |                     }
    313 |                 }
    314 |             }
    315 |         }
    316 |         else
    317 |         {
    318 |             ZU_Info << "LoadedLocalModCollection::loadLocalModCollection: Failed listDir call for \"" << mod_base_dir_path << "\"; no mods will be loaded from this path";
    319 |         }
    320 |     }
    321 | 
    322 |     if (!result->mModInfoIdentifierToModIndexMap.empty())
    323 |     {
    324 |         auto infoFile = fs->open(info_file_path);
    325 | 
    326 |         if (!infoFile)
    327 |         {
>   328 |             ZU_Warn << "LoadedLocalModCollection::loadLocalModCollection: Could not open " << info_file_path << " file; mods will not be mounted";
    329 |         }
    330 |         else
    331 |         {
    332 |             try
    333 |             {
    334 |                 FileStream config(infoFile.get());
    335 |                 auto json = Json::readFrom(config);
    336 |                 if (!json.isObject())
    337 |                 {
    338 |                     ZU_Error << "   : mod config requires a valid json object at the root";
    339 |                 }
    340 |                 else
    341 |                 {
    342 |                     bool mount_all = false;
    343 |                     std::unordered_set<size_t> mounted_set;
    344 | 
    345 |                     Json mount_order_json = json.get("mount_order");
    346 |                     if (mount_order_json.isArray())
    347 |                     {
    348 |                         for (size_t i = 0; i < mount_order_json.arrayLength(); ++i)
```

## Term: server_mod_base_paths
- Hits: 4

### .\client\client_game.cpp:992
- Signature: L963: void ClientGame::initMods()
```cpp
    972 |         client_mod_base_paths.push_back("/stock_mods/client/");      // stock mods folder
    973 |         client_mod_base_paths.push_back(user_client_mod_base_path);  // user mods folder
    974 | 
    975 |         auto fs = platform()->getFilesystem();
    976 | 
    977 |         auto loadedClientModCollection =
    978 |             modutil::LoadedLocalModCollection::loadLocalModCollection(fs, client_mod_base_paths, path::join(user_client_mod_base_path, "mods.json"), "client");
    979 |         if (loadedClientModCollection != nullptr)
    980 |         {
    981 |             mClientMountedModCollection = loadedClientModCollection->mountToFilesystem(fs);
    982 | 
    983 |             if (mClientMountedModCollection != nullptr)
    984 |             {
    985 |                 ZU_Info << "Mounted " << mClientMountedModCollection->getMods().size() << " of " << loadedClientModCollection->getMods().size() << " loaded filesystem client mods";
    986 |             }
    987 |         }
    988 |     }
    989 | 
    990 |     // server mods
    991 |     {
>   992 |         std::vector<std::string> server_mod_base_paths;
    993 |         std::string user_server_mod_base_path("/server_mods/");
    994 | 
    995 |         server_mod_base_paths.push_back("/stock_mods/server/");      // stock mods folder
    996 |         server_mod_base_paths.push_back(user_server_mod_base_path);  // user mods folder
    997 | 
    998 |         mServerLoadedLocalModCollection = modutil::LoadedLocalModCollection::loadLocalModCollection(platform()->getFilesystem(), server_mod_base_paths,
    999 |                                                                                                     path::join(user_server_mod_base_path, "mods.json"), "server");
   1000 | 
   1001 |         serverModsUpdated();
   1002 |     }
   1003 | }
   1004 | 
   1005 | void ClientGame::launchPage(std::string const& url)
   1006 | {
   1007 |     platform()->openBrowser(url, Platform::URLRestrictions::OnlyAllowHTTPSchemas);
   1008 | }
   1009 | 
   1010 | void ClientGame::launchYouTubePage(std::string const& videoId)
   1011 | {
   1012 |     launchPage("http://www.youtube.com/watch?v=" + videoId);
```

### .\client\client_game.cpp:995
- Signature: L963: void ClientGame::initMods()
```cpp
    975 |         auto fs = platform()->getFilesystem();
    976 | 
    977 |         auto loadedClientModCollection =
    978 |             modutil::LoadedLocalModCollection::loadLocalModCollection(fs, client_mod_base_paths, path::join(user_client_mod_base_path, "mods.json"), "client");
    979 |         if (loadedClientModCollection != nullptr)
    980 |         {
    981 |             mClientMountedModCollection = loadedClientModCollection->mountToFilesystem(fs);
    982 | 
    983 |             if (mClientMountedModCollection != nullptr)
    984 |             {
    985 |                 ZU_Info << "Mounted " << mClientMountedModCollection->getMods().size() << " of " << loadedClientModCollection->getMods().size() << " loaded filesystem client mods";
    986 |             }
    987 |         }
    988 |     }
    989 | 
    990 |     // server mods
    991 |     {
    992 |         std::vector<std::string> server_mod_base_paths;
    993 |         std::string user_server_mod_base_path("/server_mods/");
    994 | 
>   995 |         server_mod_base_paths.push_back("/stock_mods/server/");      // stock mods folder
    996 |         server_mod_base_paths.push_back(user_server_mod_base_path);  // user mods folder
    997 | 
    998 |         mServerLoadedLocalModCollection = modutil::LoadedLocalModCollection::loadLocalModCollection(platform()->getFilesystem(), server_mod_base_paths,
    999 |                                                                                                     path::join(user_server_mod_base_path, "mods.json"), "server");
   1000 | 
   1001 |         serverModsUpdated();
   1002 |     }
   1003 | }
   1004 | 
   1005 | void ClientGame::launchPage(std::string const& url)
   1006 | {
   1007 |     platform()->openBrowser(url, Platform::URLRestrictions::OnlyAllowHTTPSchemas);
   1008 | }
   1009 | 
   1010 | void ClientGame::launchYouTubePage(std::string const& videoId)
   1011 | {
   1012 |     launchPage("http://www.youtube.com/watch?v=" + videoId);
   1013 | }
   1014 | 
   1015 | void ClientGame::launchRetrievePasswordPage()
```

### .\client\client_game.cpp:996
- Signature: L963: void ClientGame::initMods()
```cpp
    976 | 
    977 |         auto loadedClientModCollection =
    978 |             modutil::LoadedLocalModCollection::loadLocalModCollection(fs, client_mod_base_paths, path::join(user_client_mod_base_path, "mods.json"), "client");
    979 |         if (loadedClientModCollection != nullptr)
    980 |         {
    981 |             mClientMountedModCollection = loadedClientModCollection->mountToFilesystem(fs);
    982 | 
    983 |             if (mClientMountedModCollection != nullptr)
    984 |             {
    985 |                 ZU_Info << "Mounted " << mClientMountedModCollection->getMods().size() << " of " << loadedClientModCollection->getMods().size() << " loaded filesystem client mods";
    986 |             }
    987 |         }
    988 |     }
    989 | 
    990 |     // server mods
    991 |     {
    992 |         std::vector<std::string> server_mod_base_paths;
    993 |         std::string user_server_mod_base_path("/server_mods/");
    994 | 
    995 |         server_mod_base_paths.push_back("/stock_mods/server/");      // stock mods folder
>   996 |         server_mod_base_paths.push_back(user_server_mod_base_path);  // user mods folder
    997 | 
    998 |         mServerLoadedLocalModCollection = modutil::LoadedLocalModCollection::loadLocalModCollection(platform()->getFilesystem(), server_mod_base_paths,
    999 |                                                                                                     path::join(user_server_mod_base_path, "mods.json"), "server");
   1000 | 
   1001 |         serverModsUpdated();
   1002 |     }
   1003 | }
   1004 | 
   1005 | void ClientGame::launchPage(std::string const& url)
   1006 | {
   1007 |     platform()->openBrowser(url, Platform::URLRestrictions::OnlyAllowHTTPSchemas);
   1008 | }
   1009 | 
   1010 | void ClientGame::launchYouTubePage(std::string const& videoId)
   1011 | {
   1012 |     launchPage("http://www.youtube.com/watch?v=" + videoId);
   1013 | }
   1014 | 
   1015 | void ClientGame::launchRetrievePasswordPage()
   1016 | {
```

### .\client\client_game.cpp:998
- Signature: L963: void ClientGame::initMods()
```cpp
    978 |             modutil::LoadedLocalModCollection::loadLocalModCollection(fs, client_mod_base_paths, path::join(user_client_mod_base_path, "mods.json"), "client");
    979 |         if (loadedClientModCollection != nullptr)
    980 |         {
    981 |             mClientMountedModCollection = loadedClientModCollection->mountToFilesystem(fs);
    982 | 
    983 |             if (mClientMountedModCollection != nullptr)
    984 |             {
    985 |                 ZU_Info << "Mounted " << mClientMountedModCollection->getMods().size() << " of " << loadedClientModCollection->getMods().size() << " loaded filesystem client mods";
    986 |             }
    987 |         }
    988 |     }
    989 | 
    990 |     // server mods
    991 |     {
    992 |         std::vector<std::string> server_mod_base_paths;
    993 |         std::string user_server_mod_base_path("/server_mods/");
    994 | 
    995 |         server_mod_base_paths.push_back("/stock_mods/server/");      // stock mods folder
    996 |         server_mod_base_paths.push_back(user_server_mod_base_path);  // user mods folder
    997 | 
>   998 |         mServerLoadedLocalModCollection = modutil::LoadedLocalModCollection::loadLocalModCollection(platform()->getFilesystem(), server_mod_base_paths,
    999 |                                                                                                     path::join(user_server_mod_base_path, "mods.json"), "server");
   1000 | 
   1001 |         serverModsUpdated();
   1002 |     }
   1003 | }
   1004 | 
   1005 | void ClientGame::launchPage(std::string const& url)
   1006 | {
   1007 |     platform()->openBrowser(url, Platform::URLRestrictions::OnlyAllowHTTPSchemas);
   1008 | }
   1009 | 
   1010 | void ClientGame::launchYouTubePage(std::string const& videoId)
   1011 | {
   1012 |     launchPage("http://www.youtube.com/watch?v=" + videoId);
   1013 | }
   1014 | 
   1015 | void ClientGame::launchRetrievePasswordPage()
   1016 | {
   1017 |     launchPage("https://service.planetaryannihilation.net/user/recoveraccountdialog");
   1018 | }
```

## Term: client_mod_base_paths
- Hits: 4

### .\client\client_game.cpp:969
- Signature: L963: void ClientGame::initMods()
```cpp
    949 | 
    950 |     mOverlappedUpdateComplete.signal();
    951 | 
    952 |     if (cmdline_crash.isSet()) zu::crash::doCrash();
    953 | }
    954 | 
    955 | ClientGame::~ClientGame()
    956 | {
    957 |     clearHolodecks();
    958 |     clearClientViews();
    959 | 
    960 |     mConsoleLogSink.reset();
    961 | }
    962 | 
    963 | void ClientGame::initMods()
    964 | {
    965 |     ZU_Info << "Init mods";
    966 | 
    967 |     // client mods
    968 |     {
>   969 |         std::vector<std::string> client_mod_base_paths;
    970 |         std::string user_client_mod_base_path("/client_mods/");
    971 | 
    972 |         client_mod_base_paths.push_back("/stock_mods/client/");      // stock mods folder
    973 |         client_mod_base_paths.push_back(user_client_mod_base_path);  // user mods folder
    974 | 
    975 |         auto fs = platform()->getFilesystem();
    976 | 
    977 |         auto loadedClientModCollection =
    978 |             modutil::LoadedLocalModCollection::loadLocalModCollection(fs, client_mod_base_paths, path::join(user_client_mod_base_path, "mods.json"), "client");
    979 |         if (loadedClientModCollection != nullptr)
    980 |         {
    981 |             mClientMountedModCollection = loadedClientModCollection->mountToFilesystem(fs);
    982 | 
    983 |             if (mClientMountedModCollection != nullptr)
    984 |             {
    985 |                 ZU_Info << "Mounted " << mClientMountedModCollection->getMods().size() << " of " << loadedClientModCollection->getMods().size() << " loaded filesystem client mods";
    986 |             }
    987 |         }
    988 |     }
    989 | 
```

### .\client\client_game.cpp:972
- Signature: L963: void ClientGame::initMods()
```cpp
    952 |     if (cmdline_crash.isSet()) zu::crash::doCrash();
    953 | }
    954 | 
    955 | ClientGame::~ClientGame()
    956 | {
    957 |     clearHolodecks();
    958 |     clearClientViews();
    959 | 
    960 |     mConsoleLogSink.reset();
    961 | }
    962 | 
    963 | void ClientGame::initMods()
    964 | {
    965 |     ZU_Info << "Init mods";
    966 | 
    967 |     // client mods
    968 |     {
    969 |         std::vector<std::string> client_mod_base_paths;
    970 |         std::string user_client_mod_base_path("/client_mods/");
    971 | 
>   972 |         client_mod_base_paths.push_back("/stock_mods/client/");      // stock mods folder
    973 |         client_mod_base_paths.push_back(user_client_mod_base_path);  // user mods folder
    974 | 
    975 |         auto fs = platform()->getFilesystem();
    976 | 
    977 |         auto loadedClientModCollection =
    978 |             modutil::LoadedLocalModCollection::loadLocalModCollection(fs, client_mod_base_paths, path::join(user_client_mod_base_path, "mods.json"), "client");
    979 |         if (loadedClientModCollection != nullptr)
    980 |         {
    981 |             mClientMountedModCollection = loadedClientModCollection->mountToFilesystem(fs);
    982 | 
    983 |             if (mClientMountedModCollection != nullptr)
    984 |             {
    985 |                 ZU_Info << "Mounted " << mClientMountedModCollection->getMods().size() << " of " << loadedClientModCollection->getMods().size() << " loaded filesystem client mods";
    986 |             }
    987 |         }
    988 |     }
    989 | 
    990 |     // server mods
    991 |     {
    992 |         std::vector<std::string> server_mod_base_paths;
```

### .\client\client_game.cpp:973
- Signature: L963: void ClientGame::initMods()
```cpp
    953 | }
    954 | 
    955 | ClientGame::~ClientGame()
    956 | {
    957 |     clearHolodecks();
    958 |     clearClientViews();
    959 | 
    960 |     mConsoleLogSink.reset();
    961 | }
    962 | 
    963 | void ClientGame::initMods()
    964 | {
    965 |     ZU_Info << "Init mods";
    966 | 
    967 |     // client mods
    968 |     {
    969 |         std::vector<std::string> client_mod_base_paths;
    970 |         std::string user_client_mod_base_path("/client_mods/");
    971 | 
    972 |         client_mod_base_paths.push_back("/stock_mods/client/");      // stock mods folder
>   973 |         client_mod_base_paths.push_back(user_client_mod_base_path);  // user mods folder
    974 | 
    975 |         auto fs = platform()->getFilesystem();
    976 | 
    977 |         auto loadedClientModCollection =
    978 |             modutil::LoadedLocalModCollection::loadLocalModCollection(fs, client_mod_base_paths, path::join(user_client_mod_base_path, "mods.json"), "client");
    979 |         if (loadedClientModCollection != nullptr)
    980 |         {
    981 |             mClientMountedModCollection = loadedClientModCollection->mountToFilesystem(fs);
    982 | 
    983 |             if (mClientMountedModCollection != nullptr)
    984 |             {
    985 |                 ZU_Info << "Mounted " << mClientMountedModCollection->getMods().size() << " of " << loadedClientModCollection->getMods().size() << " loaded filesystem client mods";
    986 |             }
    987 |         }
    988 |     }
    989 | 
    990 |     // server mods
    991 |     {
    992 |         std::vector<std::string> server_mod_base_paths;
    993 |         std::string user_server_mod_base_path("/server_mods/");
```

### .\client\client_game.cpp:978
- Signature: L963: void ClientGame::initMods()
```cpp
    958 |     clearClientViews();
    959 | 
    960 |     mConsoleLogSink.reset();
    961 | }
    962 | 
    963 | void ClientGame::initMods()
    964 | {
    965 |     ZU_Info << "Init mods";
    966 | 
    967 |     // client mods
    968 |     {
    969 |         std::vector<std::string> client_mod_base_paths;
    970 |         std::string user_client_mod_base_path("/client_mods/");
    971 | 
    972 |         client_mod_base_paths.push_back("/stock_mods/client/");      // stock mods folder
    973 |         client_mod_base_paths.push_back(user_client_mod_base_path);  // user mods folder
    974 | 
    975 |         auto fs = platform()->getFilesystem();
    976 | 
    977 |         auto loadedClientModCollection =
>   978 |             modutil::LoadedLocalModCollection::loadLocalModCollection(fs, client_mod_base_paths, path::join(user_client_mod_base_path, "mods.json"), "client");
    979 |         if (loadedClientModCollection != nullptr)
    980 |         {
    981 |             mClientMountedModCollection = loadedClientModCollection->mountToFilesystem(fs);
    982 | 
    983 |             if (mClientMountedModCollection != nullptr)
    984 |             {
    985 |                 ZU_Info << "Mounted " << mClientMountedModCollection->getMods().size() << " of " << loadedClientModCollection->getMods().size() << " loaded filesystem client mods";
    986 |             }
    987 |         }
    988 |     }
    989 | 
    990 |     // server mods
    991 |     {
    992 |         std::vector<std::string> server_mod_base_paths;
    993 |         std::string user_server_mod_base_path("/server_mods/");
    994 | 
    995 |         server_mod_base_paths.push_back("/stock_mods/server/");      // stock mods folder
    996 |         server_mod_base_paths.push_back(user_server_mod_base_path);  // user mods folder
    997 | 
    998 |         mServerLoadedLocalModCollection = modutil::LoadedLocalModCollection::loadLocalModCollection(platform()->getFilesystem(), server_mod_base_paths,
```

## Term: makeRemoteModCollection
- Hits: 9

### .\client\client_game.cpp:5933
- Signature: L5929: void ClientGame::serverModsUpdated()
```cpp
   5913 |         }
   5914 | 
   5915 |         mServerMountedRemoteModCollection = mServerLoadedRemoteModCollection ? mServerLoadedRemoteModCollection->mountToMemoryFilesystem(mfs) : nullptr;
   5916 | 
   5917 |         setUnitSpecTag("");  // ###chargrove $TODO make sure this doesn't have complications w/ GW integration (shouldn't since server modded games are a separate thing)
   5918 | 
   5919 |         refreshFileSystem();
   5920 | 
   5921 |         mUIBridge->sendUISignal("server_mod_info_updated", UIBridge::MessageDelivery::Reliable);
   5922 |     }
   5923 |     else
   5924 |     {
   5925 |         ZU_Error << "ClientGame::mountServerMods: Platform Filesystem is not a MemoryFilesystem; memory files are not supported";
   5926 |     }
   5927 | }
   5928 | 
   5929 | void ClientGame::serverModsUpdated()
   5930 | {
   5931 |     if (mServerLoadedLocalModCollection != nullptr)
   5932 |     {
>  5933 |         mServerLoadedRemoteModCollection = mServerLoadedLocalModCollection->makeRemoteModCollection(platform()->getFilesystem(), mCompressServerMods);
   5934 | 
   5935 |         ZU_Info << "Mounted " << mServerLoadedRemoteModCollection->getMods().size() << " of " << mServerLoadedLocalModCollection->getMods().size()
   5936 |                 << " loaded filesystem server mods";
   5937 | 
   5938 |         if (mConnectionToServer)
   5939 |         {
   5940 |             modsSendModFileDataToServer("");  // use existing auth token
   5941 |         }
   5942 |     }
   5943 |     else
   5944 |     {
   5945 |         mServerLoadedRemoteModCollection = nullptr;
   5946 |     }
   5947 | 
   5948 |     if (mUIBridge) mUIBridge->updateCachedUnitSpecs();
   5949 | }
   5950 | 
   5951 | bool ClientGame::fileMountMemoryFiles(std::string const& memory_files)
   5952 | {
   5953 |     auto mfs = platform()->getFilesystem()->isMemoryFilesystem();
```

### .\engine\crom\mod_util.cpp:77
- Signature: L28: static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
```cpp
     57 | }
     58 | 
     59 | class LoadedLocalModCollectionImpl
     60 |     : public LoadedLocalModCollection
     61 | {
     62 | public:
     63 |     typedef std::unordered_map<std::string, size_t> TModInfoIdentifierToModIndexMap;
     64 | 
     65 |     std::vector<std::shared_ptr<ModInfo>> mMods;
     66 |     std::vector<std::string> mModBaseDirSystemPaths;
     67 |     std::vector<size_t> mMountOrder;
     68 |     TModInfoIdentifierToModIndexMap mModInfoIdentifierToModIndexMap;
     69 | 
     70 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
     71 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
     72 |     virtual std::vector<std::string> const & getModBaseDirSystemPaths() const override { return mModBaseDirSystemPaths; }
     73 |     virtual std::vector<size_t> getMountOrder() const override { return mMountOrder; }
     74 |     virtual void setMountOrder(std::vector<size_t> const & mount_order) override { mMountOrder = mount_order; }
     75 | 
     76 |     virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) override;
>    77 |     virtual std::shared_ptr<LoadedRemoteModCollection> makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods) override;
     78 | 
     79 |     static std::shared_ptr<ModInfo> loadLocalMod(zu::RefNoCount<crom::Filesystem> fs, zu::StringRange mod_system_path, zu::StringRange expected_context);
     80 | };
     81 | 
     82 | class LoadedRemoteModCollectionImpl
     83 |     : public LoadedRemoteModCollection
     84 | {
     85 | public:
     86 | 
     87 |     LoadedRemoteModCollectionImpl();
     88 | 
     89 |     std::vector<std::shared_ptr<ModInfo>> mMods;
     90 |     ModFileDataPackageBundle mDataPackageBundle;
     91 | 
     92 |     size_t mEstimatedSize;
     93 | 
     94 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
     95 | 
     96 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
     97 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
```

### .\engine\crom\mod_util.cpp:461
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    441 |                 continue;
    442 |             if (newPath[0] != '/')
    443 |                 newPath = std::string("/") + newPath;
    444 | 
    445 | #ifdef COMMON_FILESYSTEM
    446 |             fs->alias(file, newPath, true);
    447 | #else
    448 |             fs->alias(file, newPath);
    449 | #endif
    450 |         }
    451 |     }
    452 | 
    453 |     // once we've mounted all of our mods onto the file system, it becomes locked against further mounting
    454 |     fs->setMountsLocked();
    455 | 
    456 |     result->mModBaseDirSystemPaths = mModBaseDirSystemPaths;
    457 |     result->mFilesystem = fs;
    458 | 
    459 |     return result;
    460 | }
>   461 | std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
    462 | {
    463 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    464 | 
    465 |     size_t estimated_size = 0;
    466 | 
    467 |     size_t mod_count = mMods.size();
    468 |     for (size_t mod_index : mMountOrder)
    469 |     {
    470 |         if (mod_index >= mod_count)
    471 |         {
    472 |             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Out-of-bounds mod index in mount order " << mod_index << ", count is " << mod_count << ", skipping.";
    473 |         }
    474 | 
    475 |         auto const & mod = mMods[mod_index];
    476 | 
    477 |         result->mMods.push_back(mod);
    478 | 
    479 |         std::string base_path = mod->mod_system_path;
    480 |         if (zu::StringRange(path::nativeToPosix(base_path)).endsWith("/"))
    481 |             base_path = base_path.substr(0, base_path.length() - 1);
```

### .\engine\crom\mod_util.cpp:472
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    452 | 
    453 |     // once we've mounted all of our mods onto the file system, it becomes locked against further mounting
    454 |     fs->setMountsLocked();
    455 | 
    456 |     result->mModBaseDirSystemPaths = mModBaseDirSystemPaths;
    457 |     result->mFilesystem = fs;
    458 | 
    459 |     return result;
    460 | }
    461 | std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
    462 | {
    463 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    464 | 
    465 |     size_t estimated_size = 0;
    466 | 
    467 |     size_t mod_count = mMods.size();
    468 |     for (size_t mod_index : mMountOrder)
    469 |     {
    470 |         if (mod_index >= mod_count)
    471 |         {
>   472 |             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Out-of-bounds mod index in mount order " << mod_index << ", count is " << mod_count << ", skipping.";
    473 |         }
    474 | 
    475 |         auto const & mod = mMods[mod_index];
    476 | 
    477 |         result->mMods.push_back(mod);
    478 | 
    479 |         std::string base_path = mod->mod_system_path;
    480 |         if (zu::StringRange(path::nativeToPosix(base_path)).endsWith("/"))
    481 |             base_path = base_path.substr(0, base_path.length() - 1);
    482 | 
    483 |         std::vector<FileInfo> files;
    484 |         if (!fs->listDir(base_path, files, ListDirRecurse::Yes))
    485 |         {
    486 |             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Failed listDir call for mod path \"" << base_path << "\"";
    487 |             continue;
    488 |         }
    489 | 
    490 |         ModFileDataPackage package;
    491 | 
    492 |         for (auto & file : files )
```

### .\engine\crom\mod_util.cpp:486
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    466 | 
    467 |     size_t mod_count = mMods.size();
    468 |     for (size_t mod_index : mMountOrder)
    469 |     {
    470 |         if (mod_index >= mod_count)
    471 |         {
    472 |             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Out-of-bounds mod index in mount order " << mod_index << ", count is " << mod_count << ", skipping.";
    473 |         }
    474 | 
    475 |         auto const & mod = mMods[mod_index];
    476 | 
    477 |         result->mMods.push_back(mod);
    478 | 
    479 |         std::string base_path = mod->mod_system_path;
    480 |         if (zu::StringRange(path::nativeToPosix(base_path)).endsWith("/"))
    481 |             base_path = base_path.substr(0, base_path.length() - 1);
    482 | 
    483 |         std::vector<FileInfo> files;
    484 |         if (!fs->listDir(base_path, files, ListDirRecurse::Yes))
    485 |         {
>   486 |             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Failed listDir call for mod path \"" << base_path << "\"";
    487 |             continue;
    488 |         }
    489 | 
    490 |         ModFileDataPackage package;
    491 | 
    492 |         for (auto & file : files )
    493 |         {
    494 |             if (file.type != FT_File)
    495 |                 continue;
    496 | 
    497 |             ZU_ASSERT(file.name.length() > base_path.length());
    498 | 
    499 |             ModFileDataEntry entry;
    500 |             entry.fileName = path::nativeToPosix(file.name.substr(base_path.length()));
    501 | 
    502 |             std::string hide_suffix = ".hide";
    503 |             if (zu::StringRange(entry.fileName).endsWith(hide_suffix))
    504 |             {
    505 |                 entry.fileName = entry.fileName.substr(0, entry.fileName.length() - hide_suffix.length());
    506 |                 entry.isSuppress = true;
```

### .\engine\crom\mod_util.cpp:525
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    505 |                 entry.fileName = entry.fileName.substr(0, entry.fileName.length() - hide_suffix.length());
    506 |                 entry.isSuppress = true;
    507 |             }
    508 |             else
    509 |             {
    510 |                 std::unique_ptr<crom::File> f = fs->open(file.name);
    511 |                 if (f)
    512 |                 {
    513 |                     int64_t fileSize = f->size();
    514 |                     if (fileSize > 0)
    515 |                     {
    516 |                         uint8_t * fileBytes = reinterpret_cast<uint8_t *>(ZU_MALLOC(fileSize));
    517 | 
    518 |                         if (fileBytes == nullptr)
    519 |                             throw std::bad_alloc();
    520 | 
    521 |                         int64_t readSize = f->read(fileBytes, fileSize);
    522 | 
    523 |                         if (readSize != fileSize)
    524 |                         {
>   525 |                             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Incomplete read of file " << file.name << ", " << readSize << " of " << fileSize << " bytes";
    526 |                         }
    527 |                         else
    528 |                         {
    529 |                             if (fileSize > std::numeric_limits<uint32_t>::max())
    530 |                             {
    531 |                                 ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: fileSize larger than available buffer. Tell the develoeprs to increase allowable file size in ModFileDataEntry.";
    532 |                             }
    533 |                             entry.fileSize = (uint32_t) fileSize;
    534 | 
    535 |                             if (compressServerMods)
    536 |                             {
    537 |                                 int max_compressed_size = (int)LZ4_COMPRESSBOUND(fileSize);
    538 | 
    539 |                                 if ((size_t)fileSize >= MIN_COMPRESS_SIZE && max_compressed_size)
    540 |                                 {
    541 |                                     entry.fileBytes.resize(max_compressed_size);
    542 | 
    543 |                                     int compressed_size = (int) LZ4_compress_default(reinterpret_cast<char const *>(&fileBytes[0]), reinterpret_cast<char *>(&entry.fileBytes[0]), (int)fileSize, max_compressed_size);
    544 | 
    545 |                                     if (compressed_size > 0)
```

### .\engine\crom\mod_util.cpp:531
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    511 |                 if (f)
    512 |                 {
    513 |                     int64_t fileSize = f->size();
    514 |                     if (fileSize > 0)
    515 |                     {
    516 |                         uint8_t * fileBytes = reinterpret_cast<uint8_t *>(ZU_MALLOC(fileSize));
    517 | 
    518 |                         if (fileBytes == nullptr)
    519 |                             throw std::bad_alloc();
    520 | 
    521 |                         int64_t readSize = f->read(fileBytes, fileSize);
    522 | 
    523 |                         if (readSize != fileSize)
    524 |                         {
    525 |                             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Incomplete read of file " << file.name << ", " << readSize << " of " << fileSize << " bytes";
    526 |                         }
    527 |                         else
    528 |                         {
    529 |                             if (fileSize > std::numeric_limits<uint32_t>::max())
    530 |                             {
>   531 |                                 ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: fileSize larger than available buffer. Tell the develoeprs to increase allowable file size in ModFileDataEntry.";
    532 |                             }
    533 |                             entry.fileSize = (uint32_t) fileSize;
    534 | 
    535 |                             if (compressServerMods)
    536 |                             {
    537 |                                 int max_compressed_size = (int)LZ4_COMPRESSBOUND(fileSize);
    538 | 
    539 |                                 if ((size_t)fileSize >= MIN_COMPRESS_SIZE && max_compressed_size)
    540 |                                 {
    541 |                                     entry.fileBytes.resize(max_compressed_size);
    542 | 
    543 |                                     int compressed_size = (int) LZ4_compress_default(reinterpret_cast<char const *>(&fileBytes[0]), reinterpret_cast<char *>(&entry.fileBytes[0]), (int)fileSize, max_compressed_size);
    544 | 
    545 |                                     if (compressed_size > 0)
    546 |                                     {
    547 |                                         entry.isCompressed = true;
    548 |                                         entry.fileBytes.resize(compressed_size);
    549 |                                     }
    550 |                                     else
    551 |                                     {
```

### .\engine\crom\mod_util.cpp:573
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    553 |                                     }
    554 |                                 }
    555 |                             }
    556 | 
    557 |                             if (!entry.isCompressed)
    558 |                             {
    559 |                                 entry.fileBytes.resize(fileSize);
    560 |                                 memcpy(entry.fileBytes.data(), fileBytes, fileSize);
    561 |                             }
    562 |                         }
    563 | 
    564 |                         if (fileBytes)
    565 |                         {
    566 |                             ZU_FREE(fileBytes);
    567 |                             fileBytes = nullptr;
    568 |                         }
    569 |                     }
    570 |                 }
    571 |                 else
    572 |                 {
>   573 |                     ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Unable to open file " << file.name;
    574 |                 }
    575 |             }
    576 | 
    577 |             estimated_size += entry.fileSize + entry.fileName.length() + 1;
    578 |             if (entry.fileSize)
    579 |             {
    580 |                 ZU_ASSERT_BREAK(entry.fileBytes.size() > 0);
    581 |             }
    582 |             package.entries.push_back(std::move(entry));
    583 |         }
    584 | 
    585 |         result->mEstimatedSize = estimated_size;
    586 | 
    587 |         result->mDataPackageBundle.packages.push_back(std::move(package));
    588 |     }
    589 | 
    590 |     return result;
    591 | }
    592 | 
    593 | std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
```

### .\engine\crom\mod_util.h:108
- Signature: L63:         virtual ~ModCollection() {}
```cpp
     88 |     // LoadedLocalModCollection - a local mod collection with a configurable mount order; can create a mounted
     89 |     //   mod collection by mounting on to a file system, or generate a remote mod collection with the same mount order.
     90 |     class LoadedLocalModCollection
     91 |         : public LocalModCollection
     92 |     {
     93 |     public:
     94 |         // load a mod collection from the given base directories, and the given info file (which optionally determines settings like mount order).
     95 |         //   Note that the base directories and info file are system paths, and are independent (the info file path does not assume any given base dir is a prefix).
     96 |         static std::shared_ptr<LoadedLocalModCollection> loadLocalModCollection(zu::RefNoCount<crom::Filesystem> fs, std::vector<std::string> const & mod_base_dir_paths, zu::StringRange info_file_path, zu::StringRange expected_context);
     97 | 
     98 |         // get/set the mount order, which are integer indices into the mod array (initial settings come from the info file)
     99 |         virtual std::vector<size_t> getMountOrder() const = 0;
    100 |         virtual void setMountOrder(std::vector<size_t> const & mount_order) = 0;
    101 | 
    102 |         // mount the mod collection to the given file system, using the current mount order settings
    103 |         virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) = 0;
    104 | 
    105 |         // generate a remote mod collection using the current mount order settings.  Note that remote mod collections support suppression
    106 |         //   of existing files (a feature of the underlying mod file data); if you wish to have a local file treated as a suppression, create the file
    107 |         //   as usual (even if it's empty) and then add an additional extension ".hide", e.g. "/pa/foo/bar.html.hide" will suppress "/pa/foo/bar.html".
>   108 |         virtual std::shared_ptr<LoadedRemoteModCollection> makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compress) = 0;
    109 |     };
    110 | 
    111 |     // LoadedRemoteModCollection - a remote mod collection which can create a mounted mod collection by mounting on to
    112 |     //   a memory file system.  The mount order for remote mod collections is implied in the data package bundle and cannot be changed.
    113 |     class LoadedRemoteModCollection
    114 |         : public RemoteModCollection
    115 |     {
    116 |     public:
    117 |         // load a mod collection from the given data package bundle
    118 |         static std::shared_ptr<LoadedRemoteModCollection> loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context);
    119 | 
    120 |         // mount the mod collection to the given memory file system
    121 |         virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) = 0;
    122 |     };
    123 | 
    124 |     // MountedLocalModCollection - a mod collection backed by local files and mounted on to a file system.
    125 |     //   The mount lasts for the scope of this collection; deleting the collection will release the mount
    126 |     //
    127 |     // ###chargrove $TODO: TECHNICAL DEBT / LIMITATION: at the moment only one mounted local mod collection
    128 |     //   can be created for the lifetime of the given file system, since there is currently no unmounting mechanism
```

## Term: loadRemoteModCollection(
- Hits: 5

### .\client\client_game.cpp:3545
- Signature: L3543: void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
```cpp
   3525 | float ClientGame::scale() const
   3526 | {
   3527 |     if (mStatMode == 2)
   3528 |         return 1;
   3529 |     else if (mConnectionToServer)
   3530 |     {
   3531 |         if (mStatMode == 3)
   3532 |             return mConnectionToServer->serverScale();
   3533 |         else if (mStatMode == 4)
   3534 |             return mConnectionToServer->simScale();
   3535 |     }
   3536 |     return platform()->getProfiler().scale();
   3537 | }
   3538 | 
   3539 | void ClientGame::connection_ProfilerStatsUpdated()
   3540 | {
   3541 | }
   3542 | 
   3543 | void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
   3544 | {
>  3545 |     auto modCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle, "server");
   3546 |     if (modCollection != nullptr)
   3547 |     {
   3548 |         mServerLoadedRemoteModCollection = modCollection;
   3549 | 
   3550 |         // we mount as soon as we download the bundle (since the bundle is coming from the server so it's expecting us to use it)
   3551 |         mountServerMods();
   3552 | 
   3553 |         // mounting mods resets the spec lib if we're using one, but that reset may be queued up and we don't want to
   3554 |         //   send our response message until after this has occurred.
   3555 | 
   3556 |         platform()->getUIThreadTaskQueue()->enqueue(
   3557 |             [=]()
   3558 |             {
   3559 |                 Json data(Json::makeObject());
   3560 |                 data.set("message_type", Json::makeString("mod_data_received"));
   3561 |                 Json payload(Json::makeObject());
   3562 |                 // payload.set("auth_token", Json::makeString(auth_token));
   3563 |                 data.set("payload", payload);
   3564 | 
   3565 |                 connSendMessage(data.asString());
```

### .\engine\crom\mod_util.cpp:593
- Signature: L593: std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
```cpp
    573 |                     ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Unable to open file " << file.name;
    574 |                 }
    575 |             }
    576 | 
    577 |             estimated_size += entry.fileSize + entry.fileName.length() + 1;
    578 |             if (entry.fileSize)
    579 |             {
    580 |                 ZU_ASSERT_BREAK(entry.fileBytes.size() > 0);
    581 |             }
    582 |             package.entries.push_back(std::move(entry));
    583 |         }
    584 | 
    585 |         result->mEstimatedSize = estimated_size;
    586 | 
    587 |         result->mDataPackageBundle.packages.push_back(std::move(package));
    588 |     }
    589 | 
    590 |     return result;
    591 | }
    592 | 
>   593 | std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
    594 | {
    595 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    596 | 
    597 |     for (auto const & package : bundle.packages)
    598 |     {
    599 |         auto loadedMod = LoadedRemoteModCollectionImpl::loadRemoteMod(package, expected_context);
    600 |         if (loadedMod != nullptr)
    601 |         {
    602 |             result->mMods.push_back(loadedMod);
    603 |             result->mDataPackageBundle.packages.push_back(package);
    604 |         }
    605 |     }
    606 | 
    607 |     return result;
    608 | }
    609 | std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
    610 | {
    611 |     std::shared_ptr<MountedRemoteModCollectionImpl> result(new MountedRemoteModCollectionImpl);
    612 | 
    613 |     for (int iPackage = static_cast<int>(mDataPackageBundle.packages.size()) - 1; iPackage >= 0; --iPackage)
```

### .\engine\crom\mod_util.h:118
- Signature: L63:         virtual ~ModCollection() {}
```cpp
     98 |         // get/set the mount order, which are integer indices into the mod array (initial settings come from the info file)
     99 |         virtual std::vector<size_t> getMountOrder() const = 0;
    100 |         virtual void setMountOrder(std::vector<size_t> const & mount_order) = 0;
    101 | 
    102 |         // mount the mod collection to the given file system, using the current mount order settings
    103 |         virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) = 0;
    104 | 
    105 |         // generate a remote mod collection using the current mount order settings.  Note that remote mod collections support suppression
    106 |         //   of existing files (a feature of the underlying mod file data); if you wish to have a local file treated as a suppression, create the file
    107 |         //   as usual (even if it's empty) and then add an additional extension ".hide", e.g. "/pa/foo/bar.html.hide" will suppress "/pa/foo/bar.html".
    108 |         virtual std::shared_ptr<LoadedRemoteModCollection> makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compress) = 0;
    109 |     };
    110 | 
    111 |     // LoadedRemoteModCollection - a remote mod collection which can create a mounted mod collection by mounting on to
    112 |     //   a memory file system.  The mount order for remote mod collections is implied in the data package bundle and cannot be changed.
    113 |     class LoadedRemoteModCollection
    114 |         : public RemoteModCollection
    115 |     {
    116 |     public:
    117 |         // load a mod collection from the given data package bundle
>   118 |         static std::shared_ptr<LoadedRemoteModCollection> loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context);
    119 | 
    120 |         // mount the mod collection to the given memory file system
    121 |         virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) = 0;
    122 |     };
    123 | 
    124 |     // MountedLocalModCollection - a mod collection backed by local files and mounted on to a file system.
    125 |     //   The mount lasts for the scope of this collection; deleting the collection will release the mount
    126 |     //
    127 |     // ###chargrove $TODO: TECHNICAL DEBT / LIMITATION: at the moment only one mounted local mod collection
    128 |     //   can be created for the lifetime of the given file system, since there is currently no unmounting mechanism
    129 |     //
    130 |     class MountedLocalModCollection
    131 |         : public LocalModCollection
    132 |     {
    133 |     public:
    134 |         // get the file system the mod collection is mounted to
    135 |         virtual zu::RefNoCount<crom::Filesystem> getFilesystem() const = 0;
    136 |     };
    137 | 
    138 |     // MountedRemoteModCollection - a mod collection backed by a data package bundle and mounted on to
```

### .\libs\server\game_server.cpp:4297
- Signature: L4281: std::unique_ptr<WorldHistory> GameServerImpl::readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson)
```cpp
   4277 | 
   4278 |     return true;
   4279 | }
   4280 | 
   4281 | std::unique_ptr<WorldHistory> GameServerImpl::readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson)
   4282 | {
   4283 |     ZU_ASSERT(outInfoJson.isObject());
   4284 | 
   4285 |     if (mServerHistory)
   4286 |         throw std::runtime_error("game already has a history");
   4287 | 
   4288 |     if (!pipe.recvUp(outReplayHeader))
   4289 |         return nullptr;
   4290 | 
   4291 |     if ((outReplayHeader.version < REPLAY_MIN_VERSION) || (outReplayHeader.version > REPLAY_CUR_VERSION))
   4292 |         return nullptr;
   4293 | 
   4294 |     bool has_mods = false;
   4295 |     if (!outReplayHeader.modBundle.packages.empty())
   4296 |     {
>  4297 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(outReplayHeader.modBundle, "server");
   4298 | 
   4299 |         if (!mLoadedModCollection)
   4300 |         {
   4301 |             ZU_Error << "GameServerImpl::readReplay: Unable to load mod collection from mod file data bundle in replay file";
   4302 |         }
   4303 |         else
   4304 |         {
   4305 |             has_mods = mountMods(server_lock);
   4306 |         }
   4307 |     }
   4308 | 
   4309 |     if (!outReplayHeader.infoJson.empty())
   4310 |     {
   4311 |         outInfoJson = parseJson(outReplayHeader.infoJson);
   4312 |     }
   4313 | 
   4314 |     outInfoJson.set("hasMods", Json::makeBoolean(has_mods));
   4315 | 
   4316 |     std::unique_ptr<WorldHistory> history(new WorldHistory());
   4317 |     if (!history->recvUp(pipe, &mEntityFactory))
```

### .\libs\server\game_server.cpp:4552
- Signature: L4534: bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
```cpp
   4532 | }
   4533 | 
   4534 | bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
   4535 | {
   4536 |     std::unique_lock<std::mutex> server_lock(mServerMutex);
   4537 | 
   4538 |     bool result = false;
   4539 |     bool authorized = true;
   4540 |     auto expected_auth_token = mModUpdateAuthToken;
   4541 |     auto const & check_auth_token = bundle_auth.auth_token;
   4542 |     if (!expected_auth_token.empty())
   4543 |     {
   4544 |         if (!string_equals(expected_auth_token, check_auth_token))
   4545 |         {
   4546 |             authorized = false;
   4547 |         }
   4548 |     }
   4549 | 
   4550 |     if (authorized)
   4551 |     {
>  4552 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle_auth.bundle, "server");
   4553 |         if (!mLoadedModCollection)
   4554 |         {
   4555 |             ZU_Error << "GameServerImpl::loadAndMountModFileData: Unable to load mod collection from mod file data bundle";
   4556 |         }
   4557 |         else
   4558 |         {
   4559 |             result = mountMods(server_lock);
   4560 |         }
   4561 |     }
   4562 |     else
   4563 |     {
   4564 |         ZU_Info << "GameServerImpl::loadAndMountModFileData: Ignoring mod file data due to invalid authentication token \"" << check_auth_token << "\", expected \"" << expected_auth_token << "\" (token may have been changed if mod data updates cheat is not enabled)";
   4565 |     }
   4566 | 
   4567 |     return result;
   4568 | }
   4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
```

## Term: "server" (as load context argument)
- Hits: 3

### .\client\client_game.cpp:3545
- Signature: L3543: void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
```cpp
   3525 | float ClientGame::scale() const
   3526 | {
   3527 |     if (mStatMode == 2)
   3528 |         return 1;
   3529 |     else if (mConnectionToServer)
   3530 |     {
   3531 |         if (mStatMode == 3)
   3532 |             return mConnectionToServer->serverScale();
   3533 |         else if (mStatMode == 4)
   3534 |             return mConnectionToServer->simScale();
   3535 |     }
   3536 |     return platform()->getProfiler().scale();
   3537 | }
   3538 | 
   3539 | void ClientGame::connection_ProfilerStatsUpdated()
   3540 | {
   3541 | }
   3542 | 
   3543 | void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
   3544 | {
>  3545 |     auto modCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle, "server");
   3546 |     if (modCollection != nullptr)
   3547 |     {
   3548 |         mServerLoadedRemoteModCollection = modCollection;
   3549 | 
   3550 |         // we mount as soon as we download the bundle (since the bundle is coming from the server so it's expecting us to use it)
   3551 |         mountServerMods();
   3552 | 
   3553 |         // mounting mods resets the spec lib if we're using one, but that reset may be queued up and we don't want to
   3554 |         //   send our response message until after this has occurred.
   3555 | 
   3556 |         platform()->getUIThreadTaskQueue()->enqueue(
   3557 |             [=]()
   3558 |             {
   3559 |                 Json data(Json::makeObject());
   3560 |                 data.set("message_type", Json::makeString("mod_data_received"));
   3561 |                 Json payload(Json::makeObject());
   3562 |                 // payload.set("auth_token", Json::makeString(auth_token));
   3563 |                 data.set("payload", payload);
   3564 | 
   3565 |                 connSendMessage(data.asString());
```

### .\libs\server\game_server.cpp:4297
- Signature: L4281: std::unique_ptr<WorldHistory> GameServerImpl::readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson)
```cpp
   4277 | 
   4278 |     return true;
   4279 | }
   4280 | 
   4281 | std::unique_ptr<WorldHistory> GameServerImpl::readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson)
   4282 | {
   4283 |     ZU_ASSERT(outInfoJson.isObject());
   4284 | 
   4285 |     if (mServerHistory)
   4286 |         throw std::runtime_error("game already has a history");
   4287 | 
   4288 |     if (!pipe.recvUp(outReplayHeader))
   4289 |         return nullptr;
   4290 | 
   4291 |     if ((outReplayHeader.version < REPLAY_MIN_VERSION) || (outReplayHeader.version > REPLAY_CUR_VERSION))
   4292 |         return nullptr;
   4293 | 
   4294 |     bool has_mods = false;
   4295 |     if (!outReplayHeader.modBundle.packages.empty())
   4296 |     {
>  4297 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(outReplayHeader.modBundle, "server");
   4298 | 
   4299 |         if (!mLoadedModCollection)
   4300 |         {
   4301 |             ZU_Error << "GameServerImpl::readReplay: Unable to load mod collection from mod file data bundle in replay file";
   4302 |         }
   4303 |         else
   4304 |         {
   4305 |             has_mods = mountMods(server_lock);
   4306 |         }
   4307 |     }
   4308 | 
   4309 |     if (!outReplayHeader.infoJson.empty())
   4310 |     {
   4311 |         outInfoJson = parseJson(outReplayHeader.infoJson);
   4312 |     }
   4313 | 
   4314 |     outInfoJson.set("hasMods", Json::makeBoolean(has_mods));
   4315 | 
   4316 |     std::unique_ptr<WorldHistory> history(new WorldHistory());
   4317 |     if (!history->recvUp(pipe, &mEntityFactory))
```

### .\libs\server\game_server.cpp:4552
- Signature: L4534: bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
```cpp
   4532 | }
   4533 | 
   4534 | bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
   4535 | {
   4536 |     std::unique_lock<std::mutex> server_lock(mServerMutex);
   4537 | 
   4538 |     bool result = false;
   4539 |     bool authorized = true;
   4540 |     auto expected_auth_token = mModUpdateAuthToken;
   4541 |     auto const & check_auth_token = bundle_auth.auth_token;
   4542 |     if (!expected_auth_token.empty())
   4543 |     {
   4544 |         if (!string_equals(expected_auth_token, check_auth_token))
   4545 |         {
   4546 |             authorized = false;
   4547 |         }
   4548 |     }
   4549 | 
   4550 |     if (authorized)
   4551 |     {
>  4552 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle_auth.bundle, "server");
   4553 |         if (!mLoadedModCollection)
   4554 |         {
   4555 |             ZU_Error << "GameServerImpl::loadAndMountModFileData: Unable to load mod collection from mod file data bundle";
   4556 |         }
   4557 |         else
   4558 |         {
   4559 |             result = mountMods(server_lock);
   4560 |         }
   4561 |     }
   4562 |     else
   4563 |     {
   4564 |         ZU_Info << "GameServerImpl::loadAndMountModFileData: Ignoring mod file data due to invalid authentication token \"" << check_auth_token << "\", expected \"" << expected_auth_token << "\" (token may have been changed if mod data updates cheat is not enabled)";
   4565 |     }
   4566 | 
   4567 |     return result;
   4568 | }
   4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
```

## Term: mountToMemoryFilesystem
- Hits: 5

### .\client\client_game.cpp:5915
- Signature: L5902: void ClientGame::mountServerMods()
```cpp
   5895 | 
   5896 | void ClientGame::modsMountModFileData()
   5897 | {
   5898 |     mountServerMods();
   5899 | }
   5900 | 
   5901 | 
   5902 | void ClientGame::mountServerMods()
   5903 | {
   5904 |     auto mfs = platform()->getFilesystem()->isMemoryFilesystem();
   5905 |     if (mfs)
   5906 |     {
   5907 |         if (mServerMountedRemoteModCollection)
   5908 |         {
   5909 |             mServerMountedRemoteModCollection->unmount();
   5910 | 
   5911 |             // Re-mount zips.
   5912 |             for (auto&& zipMount : mMountedZips) mfs->mountZipFile(zipMount.first, zipMount.second);
   5913 |         }
   5914 | 
>  5915 |         mServerMountedRemoteModCollection = mServerLoadedRemoteModCollection ? mServerLoadedRemoteModCollection->mountToMemoryFilesystem(mfs) : nullptr;
   5916 | 
   5917 |         setUnitSpecTag("");  // ###chargrove $TODO make sure this doesn't have complications w/ GW integration (shouldn't since server modded games are a separate thing)
   5918 | 
   5919 |         refreshFileSystem();
   5920 | 
   5921 |         mUIBridge->sendUISignal("server_mod_info_updated", UIBridge::MessageDelivery::Reliable);
   5922 |     }
   5923 |     else
   5924 |     {
   5925 |         ZU_Error << "ClientGame::mountServerMods: Platform Filesystem is not a MemoryFilesystem; memory files are not supported";
   5926 |     }
   5927 | }
   5928 | 
   5929 | void ClientGame::serverModsUpdated()
   5930 | {
   5931 |     if (mServerLoadedLocalModCollection != nullptr)
   5932 |     {
   5933 |         mServerLoadedRemoteModCollection = mServerLoadedLocalModCollection->makeRemoteModCollection(platform()->getFilesystem(), mCompressServerMods);
   5934 | 
   5935 |         ZU_Info << "Mounted " << mServerLoadedRemoteModCollection->getMods().size() << " of " << mServerLoadedLocalModCollection->getMods().size()
```

### .\engine\crom\mod_util.cpp:100
- Signature: L28: static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
```cpp
     80 | };
     81 | 
     82 | class LoadedRemoteModCollectionImpl
     83 |     : public LoadedRemoteModCollection
     84 | {
     85 | public:
     86 | 
     87 |     LoadedRemoteModCollectionImpl();
     88 | 
     89 |     std::vector<std::shared_ptr<ModInfo>> mMods;
     90 |     ModFileDataPackageBundle mDataPackageBundle;
     91 | 
     92 |     size_t mEstimatedSize;
     93 | 
     94 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
     95 | 
     96 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
     97 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
     98 |     virtual ModFileDataPackageBundle const & getDataPackageBundle() const override { return mDataPackageBundle; }
     99 | 
>   100 |     virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) override;
    101 | 
    102 |     static std::shared_ptr<ModInfo> loadRemoteMod(ModFileDataPackage const & package, zu::StringRange expected_context);
    103 | };
    104 | 
    105 | LoadedRemoteModCollectionImpl::LoadedRemoteModCollectionImpl()
    106 |     : mEstimatedSize(0)
    107 | {
    108 | }
    109 | 
    110 | class MountedLocalModCollectionImpl
    111 |     : public MountedLocalModCollection
    112 | {
    113 | public:
    114 |     std::vector<std::shared_ptr<ModInfo>> mMods;
    115 |     std::vector<std::string> mModBaseDirSystemPaths;
    116 |     zu::Ref<crom::Filesystem> mFilesystem;
    117 | 
    118 |     MountedLocalModCollectionImpl();
    119 | 
    120 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
```

### .\engine\crom\mod_util.cpp:609
- Signature: L609: std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
```cpp
    589 | 
    590 |     return result;
    591 | }
    592 | 
    593 | std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
    594 | {
    595 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    596 | 
    597 |     for (auto const & package : bundle.packages)
    598 |     {
    599 |         auto loadedMod = LoadedRemoteModCollectionImpl::loadRemoteMod(package, expected_context);
    600 |         if (loadedMod != nullptr)
    601 |         {
    602 |             result->mMods.push_back(loadedMod);
    603 |             result->mDataPackageBundle.packages.push_back(package);
    604 |         }
    605 |     }
    606 | 
    607 |     return result;
    608 | }
>   609 | std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
    610 | {
    611 |     std::shared_ptr<MountedRemoteModCollectionImpl> result(new MountedRemoteModCollectionImpl);
    612 | 
    613 |     for (int iPackage = static_cast<int>(mDataPackageBundle.packages.size()) - 1; iPackage >= 0; --iPackage)
    614 |     {
    615 |         auto const & package = mDataPackageBundle.packages[iPackage];
    616 | 
    617 |         for (auto const & entry : package.entries)
    618 |         {
    619 |             if (entry.isSuppress)
    620 |                 mfs->mountMemoryFileAsSuppress(entry.fileName);
    621 |             else
    622 |             {
    623 |                 size_t size = entry.fileSize;
    624 | 
    625 |                 uint8_t * fileBytes = reinterpret_cast<uint8_t *>(ZU_MALLOC(size));
    626 | 
    627 |                 if (fileBytes == nullptr)
    628 |                     throw std::bad_alloc();
    629 | 
```

### .\engine\crom\mod_util.h:121
- Signature: L63:         virtual ~ModCollection() {}
```cpp
    101 | 
    102 |         // mount the mod collection to the given file system, using the current mount order settings
    103 |         virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) = 0;
    104 | 
    105 |         // generate a remote mod collection using the current mount order settings.  Note that remote mod collections support suppression
    106 |         //   of existing files (a feature of the underlying mod file data); if you wish to have a local file treated as a suppression, create the file
    107 |         //   as usual (even if it's empty) and then add an additional extension ".hide", e.g. "/pa/foo/bar.html.hide" will suppress "/pa/foo/bar.html".
    108 |         virtual std::shared_ptr<LoadedRemoteModCollection> makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compress) = 0;
    109 |     };
    110 | 
    111 |     // LoadedRemoteModCollection - a remote mod collection which can create a mounted mod collection by mounting on to
    112 |     //   a memory file system.  The mount order for remote mod collections is implied in the data package bundle and cannot be changed.
    113 |     class LoadedRemoteModCollection
    114 |         : public RemoteModCollection
    115 |     {
    116 |     public:
    117 |         // load a mod collection from the given data package bundle
    118 |         static std::shared_ptr<LoadedRemoteModCollection> loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context);
    119 | 
    120 |         // mount the mod collection to the given memory file system
>   121 |         virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) = 0;
    122 |     };
    123 | 
    124 |     // MountedLocalModCollection - a mod collection backed by local files and mounted on to a file system.
    125 |     //   The mount lasts for the scope of this collection; deleting the collection will release the mount
    126 |     //
    127 |     // ###chargrove $TODO: TECHNICAL DEBT / LIMITATION: at the moment only one mounted local mod collection
    128 |     //   can be created for the lifetime of the given file system, since there is currently no unmounting mechanism
    129 |     //
    130 |     class MountedLocalModCollection
    131 |         : public LocalModCollection
    132 |     {
    133 |     public:
    134 |         // get the file system the mod collection is mounted to
    135 |         virtual zu::RefNoCount<crom::Filesystem> getFilesystem() const = 0;
    136 |     };
    137 | 
    138 |     // MountedRemoteModCollection - a mod collection backed by a data package bundle and mounted on to
    139 |     //   a memory file system.  The mount lasts for the scope of this collection; deleting the collection
    140 |     //   will release the mount.
    141 |     //
```

### .\libs\server\game_server.cpp:4605
- Signature: L4590: bool GameServerImpl::mountMods(std::unique_lock<std::mutex> & server_lock)
```cpp
   4585 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4586 | 
   4587 |     return mMountedModCollection ? mMountedModCollection->getEstimatedSize() : 1;
   4588 | }
   4589 | 
   4590 | bool GameServerImpl::mountMods(std::unique_lock<std::mutex> & server_lock)
   4591 | {
   4592 |     ZU_ASSERT(mLoadedModCollection != nullptr); // should only call this if we know we have a loaded mod collection
   4593 | 
   4594 |     bool result = false;
   4595 | 
   4596 |     auto mfs = mSpecLib->filesystem()->isMemoryFilesystem();
   4597 |     if (mfs)
   4598 |     {
   4599 |         if (mMountedModCollection)
   4600 |         {
   4601 |             mMountedModCollection->unmount();
   4602 |             mDriverHandle->driver->mountContent(mRequiredContent);
   4603 |         }
   4604 | 
>  4605 |         mMountedModCollection = mLoadedModCollection->mountToMemoryFilesystem(mfs);
   4606 | 
   4607 |         // invalidate specs for any entries that have been updated
   4608 |         if (mMountedModCollection != nullptr)
   4609 |         {
   4610 |             size_t entryCount = 0;
   4611 |             auto const & bundle = mMountedModCollection->getDataPackageBundle();
   4612 |             for (auto const & package : bundle.packages)
   4613 |             {
   4614 |                 for (auto const & entry : package.entries)
   4615 |                 {
   4616 |                     mSpecLib->invalidate(entry.fileName);
   4617 |                     ++entryCount;
   4618 |                 }
   4619 |             }
   4620 | 
   4621 |             if (mSimCreated)
   4622 |             {
   4623 |                 mSimThread->enqueue([this] () {
   4624 |                         for (auto & kvp : mSim->world().unit_type_db)
   4625 |                             kvp.second->enqueueReloadUnitSpecs();
```

## Term: sendModFileData(
- Hits: 7

### .\client\client_connection.cpp:165
- Signature: L165: void ConnectionToServer::sendModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth, size_t estimated_size)
```cpp
    145 |         }
    146 |     }
    147 | 
    148 |     if (activePipe())
    149 |         activePipe()->flush();
    150 | }
    151 | 
    152 | void ConnectionToServer::sendMessage(Json const & json)
    153 | {
    154 |     std::stringstream s;
    155 |     s << json;
    156 |     sendMessage(s.str());
    157 | }
    158 | 
    159 | void ConnectionToServer::sendMessage(StringRange str)
    160 | {
    161 |     if (mCommandEndpoint)
    162 |         mCommandEndpoint->sendUp(GameServerCommand::makeMessage(str.toString()), str.size() + 4);
    163 | }
    164 | 
>   165 | void ConnectionToServer::sendModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth, size_t estimated_size)
    166 | {
    167 |     if (mCommandEndpoint)
    168 |         mCommandEndpoint->sendUp(GameServerCommand::makeUploadModFileData(bundle_auth), estimated_size);
    169 | }
    170 | 
    171 | void ConnectionToServer::connect(float dt)
    172 | {
    173 |     assert(!mCommandEndpoint);
    174 | 
    175 |     mNextConnect -= dt;
    176 |     if (mNextConnect > 0)
    177 |         return;
    178 | 
    179 | #ifdef HAVE_STEAM
    180 |     if (mServerSteamId != 0)
    181 |     {
    182 |         SteamNetworkingIdentity identity;
    183 |         identity.SetSteamID64(mServerSteamId);
    184 |         HSteamNetConnection conn = SteamNetworkingSockets()->ConnectP2P(identity, 0, 0, nullptr);
    185 |         if (conn == k_HSteamNetConnection_Invalid)
```

### .\client\client_connection.h:147
- Signature: L142:         float simScale() const { return mSimScale; }
```cpp
    127 |                                     uint64_t server_steam_id = 0);
    128 | 
    129 |         ~ConnectionToServer();
    130 | 
    131 |         void update(float dt);
    132 | 
    133 |         bool connected() const { return mState == STATE_Connected; }
    134 |         bool live() const { return mState != STATE_Disconnected; }
    135 | 
    136 |         netutil::UberProtoPipe * cmdPipe() { return mCommandEndpoint.get(); }
    137 |         HistoryViewer * historyViewer() const { return mHistoryViewer.get(); }
    138 | 
    139 |         crom::SectionData const & serverStats() const { return mServerStats; }
    140 |         crom::SectionData const & simStats() const { return mSimStats; }
    141 |         float serverScale() const { return mServerScale; }
    142 |         float simScale() const { return mSimScale; }
    143 | 
    144 |         void sendMessage(zu::Json const & msg);
    145 |         void sendMessage(zu::StringRange msg);
    146 | 
>   147 |         void sendModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth, size_t estiamted_size);
    148 | 
    149 |       private:
    150 | 
    151 |         net::MsgPipe * activePipe() const;
    152 | 
    153 |         void initialize();
    154 | 
    155 |         void connect(float dt);
    156 |         void updateConnection(float dt);
    157 | 
    158 |         bool sendLogin();
    159 |         
    160 |         void processConnectionResult(net::ConnectResult res);
    161 |         bool processLoginResponse();
    162 |         bool processSimCreated(SimCreatedData const & data);
    163 |         bool processSimTerminated(SimTerminatedData const & data);
    164 |         bool processProfilerStats(std::vector<uint8_t> const & data, bool isSim);
    165 |         bool processMessage(std::string const & data);
    166 |         bool processVisionBits(BitVectorData const & data);
    167 |         bool processControlBits(BitVectorData const & data);
```

### .\client\client_game.cpp:5892
- Signature: L5869: void ClientGame::modsSendModFileDataToServer(std::string const& auth_token)
```cpp
   5872 |     if (!auth_token.empty())
   5873 |     {
   5874 |         mModUpdateAuthToken = auth_token;
   5875 |     }
   5876 |     if (mModUpdateAuthToken.empty())
   5877 |     {
   5878 |         ZU_Error << "modsSendModFileDataToServer: Unable to send mod file data (No auth token)";
   5879 |         return;
   5880 |     }
   5881 | 
   5882 |     if (!mConnectionToServer)
   5883 |     {
   5884 |         ZU_Error << "modsSendModFileDataToServer: Unable to send mod file data (No connection)";
   5885 |         return;
   5886 |     }
   5887 | 
   5888 |     if (mServerLoadedRemoteModCollection != nullptr)
   5889 |     {
   5890 |         ModFileDataPackageBundleAuthorized bundle_auth(mModUpdateAuthToken, mServerLoadedRemoteModCollection->getDataPackageBundle());
   5891 | 
>  5892 |         mConnectionToServer->sendModFileData(bundle_auth, mServerLoadedRemoteModCollection->getEstimatedSize());
   5893 |     }
   5894 | }
   5895 | 
   5896 | void ClientGame::modsMountModFileData()
   5897 | {
   5898 |     mountServerMods();
   5899 | }
   5900 | 
   5901 | 
   5902 | void ClientGame::mountServerMods()
   5903 | {
   5904 |     auto mfs = platform()->getFilesystem()->isMemoryFilesystem();
   5905 |     if (mfs)
   5906 |     {
   5907 |         if (mServerMountedRemoteModCollection)
   5908 |         {
   5909 |             mServerMountedRemoteModCollection->unmount();
   5910 | 
   5911 |             // Re-mount zips.
   5912 |             for (auto&& zipMount : mMountedZips) mfs->mountZipFile(zipMount.first, zipMount.second);
```

### .\libs\server\game_server.cpp:198
- Signature: Not found within 120 lines above match
```cpp
    178 |     ConnectionImpl(GameServerImpl * game_server, HistoryServer * history_server, std::string const & debug_descr, RefNoCount<net::Socket> socket);
    179 | #ifdef HAVE_STEAM
    180 |     ConnectionImpl(GameServerImpl * game_server, HistoryServer * history_server, std::string const & debug_descr, net::SteamMsgPipe * steam_pipe);
    181 | #endif
    182 |     ~ConnectionImpl();
    183 | 
    184 |     // Connection interface.
    185 |     virtual std::string const & debugDescription() const override { return debug_descr; }
    186 |     virtual std::string const & playerName() const override { return player_name; }
    187 |     virtual std::string const & playerIdentity() const override { return player_identity; }
    188 |     virtual std::string const & playerData() const override { return player_data; }
    189 |     virtual Ref<net::GSPlayerInfo> ubernetData() const override { return ubernet_player_info; }
    190 | 
    191 |     virtual bool connected() const override;
    192 |     virtual void setCheatsAllowed(bool value) override;
    193 |     virtual void setArmyControlBits(BitVec const & bits) override;
    194 |     virtual void setArmyVisionBits(BitVec const & bits) override;
    195 |     virtual BitVec getArmyVisionBits() const override;
    196 |     virtual void sendMessage(Json const & json) override;
    197 |     virtual void sendMessage(std::string const & message) override;
>   198 |     virtual void sendModFileData(ModFileDataPackageBundle const & bundle, size_t estimated_size) override;
    199 |     virtual void close() override;
    200 | 
    201 |     void reset();
    202 | 
    203 |     void sendUpArmyControlBits(std::unique_lock<std::mutex> & lock) const;
    204 |     void sendUpArmyVisionBits(std::unique_lock<std::mutex> & lock) const;
    205 | };
    206 | 
    207 | 
    208 | class GameServerImpl;
    209 | 
    210 | 
    211 | class SimHandleImpl : public DListItem<SimHandleImpl>
    212 | {
    213 |     GameServerImpl * mServer;
    214 | 
    215 |   public:
    216 | 
    217 |     explicit SimHandleImpl(GameServerImpl * server);
    218 |     virtual ~SimHandleImpl();
```

### .\libs\server\game_server.cpp:787
- Signature: L787: void ConnectionImpl::sendModFileData(ModFileDataPackageBundle const & bundle, size_t estimated_size)
```cpp
    767 | }
    768 | 
    769 | void ConnectionImpl::sendMessage(Json const & json)
    770 | {
    771 |     std::stringstream s;
    772 |     s << json;
    773 | 
    774 |     sendMessage(s.str());
    775 | }
    776 | 
    777 | void ConnectionImpl::sendMessage(std::string const & message)
    778 | {
    779 |     std::lock_guard<std::mutex> server_lock(game_server->mServerMutex);
    780 | 
    781 |     if (state != STATE_Connected)
    782 |         return;
    783 | 
    784 |     cmd_endpoint->sendUp(GameClientCommand::makeMessage(message));
    785 | }
    786 | 
>   787 | void ConnectionImpl::sendModFileData(ModFileDataPackageBundle const & bundle, size_t estimated_size)
    788 | {
    789 |     std::lock_guard<std::mutex> server_lock(game_server->mServerMutex);
    790 | 
    791 |     if (state != STATE_Connected)
    792 |         return;
    793 | 
    794 |     cmd_endpoint->sendUp(GameClientCommand::makeDownloadModFileData(bundle), estimated_size);
    795 | }
    796 | 
    797 | void ConnectionImpl::close()
    798 | {
    799 |     std::lock_guard<std::mutex> server_lock(game_server->mServerMutex);
    800 | 
    801 |     ZU_Info << debug_descr << ": close()";
    802 |     switch (state)
    803 |     {
    804 |         case STATE_Connected:
    805 |         {
    806 |             game_server->closeHistoryConnection(this, server_lock);
    807 |             cmd_endpoint->sendEndOfStream();
```

### .\libs\server\game_server.h:307
- Signature: L192:     virtual ~GameServer() { }
```cpp
    287 | 
    288 | class GameServer::Connection : public zu::Counted
    289 | {
    290 |   public:
    291 |     virtual std::string const & playerName() const = 0;
    292 |     virtual std::string const & playerIdentity() const = 0;
    293 |     virtual std::string const & debugDescription() const = 0;
    294 |     virtual std::string const & playerData() const = 0;
    295 |     virtual zu::Ref<net::GSPlayerInfo> ubernetData() const = 0;
    296 | 
    297 |     virtual bool connected() const = 0;
    298 | 
    299 |     virtual void setCheatsAllowed(bool value) = 0;
    300 | 
    301 |     virtual void setArmyControlBits(zu::BitVec const & bits) = 0;
    302 |     virtual void setArmyVisionBits(zu::BitVec const & bits) = 0;
    303 |     virtual zu::BitVec getArmyVisionBits() const = 0;
    304 | 
    305 |     virtual void sendMessage(zu::Json const & msg) = 0;
    306 |     virtual void sendMessage(std::string const & message) = 0;
>   307 |     virtual void sendModFileData(ModFileDataPackageBundle const & bundle, size_t estimated_size) = 0;
    308 | 
    309 |     virtual void close() = 0;
    310 | };
    311 | 
    312 | 
    313 | class GameServer::Driver
    314 | {
    315 |   protected:
    316 |     virtual ~Driver() { }
    317 | 
    318 |   public:
    319 | 
    320 |     virtual void newConnection(zu::RefNoCount<GameServer::Connection> connection) = 0;
    321 |     virtual void reconnected(zu::RefNoCount<GameServer::Connection> connection) = 0;
    322 |     virtual void disconnected(zu::RefNoCount<GameServer::Connection> connection) = 0;
    323 | 
    324 |     virtual void recvMessage(zu::RefNoCount<GameServer::Connection> connection, std::string const & msg) = 0;
    325 |     virtual void recvModFileData(zu::RefNoCount<GameServer::Connection> connection, ModFileDataPackageBundleAuthorized const & bundle_auth) = 0;
    326 | 
    327 |     virtual void createSimFinished(SimCreationMode mode) = 0;
```

### .\libs\server\server_module.cpp:475
- Signature: L467: void ServerModule::js_client_downloadModsFromServer(v8::FunctionCallbackInfo<v8::Value> const & info)
```cpp
    455 | 
    456 | void ServerModule::js_client_giveFullVision(v8::FunctionCallbackInfo<v8::Value> const & info)
    457 | {
    458 |     auto self = getSelf(info.Data());
    459 |     auto client = self->mClients->getElementSelf(info.This());
    460 |     if (!client || !client->connection)
    461 |         return;
    462 |     zu::BitVec bits;
    463 |     bits.oneFill(0, 99); // just an arbitrarily large number of army bits
    464 |     client->connection->setArmyVisionBits(bits);
    465 | }
    466 | 
    467 | void ServerModule::js_client_downloadModsFromServer(v8::FunctionCallbackInfo<v8::Value> const & info)
    468 | {
    469 |     auto self = getSelf(info.Data());
    470 |     auto client = self->mClients->getElementSelf(info.This());
    471 |     if (!client || !client->connection)
    472 |         return;
    473 | 
    474 |     // ###chargrove $TODO $OPENQUESTION does it have to be mounted by this point? is any loaded okay? not urgent, just something to think about for the long term
>   475 |     client->connection->sendModFileData(self->mHost->getServer()->getMountedModsDataPackageBundle(), self->mHost->getServer()->getMountedModsDataPackageBundleEstimatedSize());
    476 | }
    477 | 
    478 | void ServerModule::js_get_onConnect(v8::Local<v8::String> property, v8::PropertyCallbackInfo<v8::Value> const & info)
    479 | {
    480 |     auto self = getSelf(info.Data());
    481 |     info.GetReturnValue().Set(Local<Value>::New(self->mIsolate, self->mOnConnect));
    482 | }
    483 | 
    484 | void ServerModule::js_set_onConnect(v8::Local<v8::String> property, v8::Local<v8::Value> value, v8::PropertyCallbackInfo<void> const & info)
    485 | {
    486 |     auto self = getSelf(info.Data());
    487 |     self->mOnConnect.Reset(self->mIsolate, value);
    488 | }
    489 | 
    490 | void ServerModule::js_get_onLadderGameMarkedComplete(v8::Local<v8::String> property, v8::PropertyCallbackInfo<v8::Value> const & info)
    491 | {
    492 |     auto self = getSelf(info.Data());
    493 |     info.GetReturnValue().Set(Local<Value>::New(self->mIsolate, self->mOnLadderGameMarkedComplete));
    494 | }
    495 | 
```

## Term: loadAndMountModFileData
- Hits: 6

### .\libs\server\game_server.cpp:555
- Signature: Not found within 120 lines above match
```cpp
    535 |             ::dumpHistory(&mEntityFactory, *mServerHistory, stream);
    536 |         else
    537 |             stream << "No server history!";
    538 |     }
    539 | 
    540 |     virtual void setReplayConfig(Json const & replayConfigSummaryJson, Json const & replayConfigFullJson) override;
    541 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, Json & inOutInfoJson) const override;
    542 |     virtual void setGameConfig(Json const & config) override;
    543 |     virtual Json getGameConfig() override;
    544 |     virtual Json getReplayConfigSummary() override;
    545 |     virtual Json getFullReplayConfig() override;
    546 |     virtual void describeHistoryStats(Json desc) const override;
    547 | 
    548 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, Json & outInfoJson) override;
    549 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, Json & outInfoJson) override;
    550 |     virtual void createSimFromReplay() override;
    551 |     virtual void trimHistoryAndStartSim(float load_time) override;
    552 | 
    553 |     virtual std::string getModUpdateAuthToken() const override;
    554 |     virtual void resetModUpdateAuthToken() override;
>   555 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) override;
    556 |     virtual Json getMountedModsJsonArray() const override;
    557 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const override;
    558 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const override;
    559 | 
    560 |     virtual void toggleNavDebug() override { mDriverHandle->driver->toggleNavDebug(); }
    561 |     virtual void initDropletTest(Vec3f const & position) override { mDriverHandle->driver->initDropletTest(position); }
    562 | 
    563 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) override { mRequiredContent = requiredContent; }
    564 | 
    565 | #ifdef HAVE_STEAM
    566 |     void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) override;
    567 | #endif
    568 | 
    569 |   private:
    570 | 
    571 | #ifdef HAVE_STEAM
    572 |     void pollSteamConnections();
    573 |     void acceptSteamConnection();
    574 | #endif
    575 | 
```

### .\libs\server\game_server.cpp:4534
- Signature: L4534: bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
```cpp
   4514 |     }
   4515 | 
   4516 |     desc.set("all_history", stats.toJson());
   4517 | }
   4518 | 
   4519 | std::string GameServerImpl::getModUpdateAuthToken() const
   4520 | {
   4521 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4522 | 
   4523 |     return mModUpdateAuthToken;
   4524 | }
   4525 | 
   4526 | void GameServerImpl::resetModUpdateAuthToken()
   4527 | {
   4528 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4529 | 
   4530 |     mModUpdateAuthToken = UUID::random().toString();
   4531 |     ZU_Info << "GameServerImpl::resetModUpdateAuthToken: Auth token reset to \"" << mModUpdateAuthToken << "\"";
   4532 | }
   4533 | 
>  4534 | bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
   4535 | {
   4536 |     std::unique_lock<std::mutex> server_lock(mServerMutex);
   4537 | 
   4538 |     bool result = false;
   4539 |     bool authorized = true;
   4540 |     auto expected_auth_token = mModUpdateAuthToken;
   4541 |     auto const & check_auth_token = bundle_auth.auth_token;
   4542 |     if (!expected_auth_token.empty())
   4543 |     {
   4544 |         if (!string_equals(expected_auth_token, check_auth_token))
   4545 |         {
   4546 |             authorized = false;
   4547 |         }
   4548 |     }
   4549 | 
   4550 |     if (authorized)
   4551 |     {
   4552 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle_auth.bundle, "server");
   4553 |         if (!mLoadedModCollection)
   4554 |         {
```

### .\libs\server\game_server.cpp:4555
- Signature: L4534: bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
```cpp
   4535 | {
   4536 |     std::unique_lock<std::mutex> server_lock(mServerMutex);
   4537 | 
   4538 |     bool result = false;
   4539 |     bool authorized = true;
   4540 |     auto expected_auth_token = mModUpdateAuthToken;
   4541 |     auto const & check_auth_token = bundle_auth.auth_token;
   4542 |     if (!expected_auth_token.empty())
   4543 |     {
   4544 |         if (!string_equals(expected_auth_token, check_auth_token))
   4545 |         {
   4546 |             authorized = false;
   4547 |         }
   4548 |     }
   4549 | 
   4550 |     if (authorized)
   4551 |     {
   4552 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle_auth.bundle, "server");
   4553 |         if (!mLoadedModCollection)
   4554 |         {
>  4555 |             ZU_Error << "GameServerImpl::loadAndMountModFileData: Unable to load mod collection from mod file data bundle";
   4556 |         }
   4557 |         else
   4558 |         {
   4559 |             result = mountMods(server_lock);
   4560 |         }
   4561 |     }
   4562 |     else
   4563 |     {
   4564 |         ZU_Info << "GameServerImpl::loadAndMountModFileData: Ignoring mod file data due to invalid authentication token \"" << check_auth_token << "\", expected \"" << expected_auth_token << "\" (token may have been changed if mod data updates cheat is not enabled)";
   4565 |     }
   4566 | 
   4567 |     return result;
   4568 | }
   4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
   4573 |     return mMountedModCollection ? mMountedModCollection->getModsJsonArray() : Json::makeArray();
   4574 | }
   4575 | 
```

### .\libs\server\game_server.cpp:4564
- Signature: L4534: bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
```cpp
   4544 |         if (!string_equals(expected_auth_token, check_auth_token))
   4545 |         {
   4546 |             authorized = false;
   4547 |         }
   4548 |     }
   4549 | 
   4550 |     if (authorized)
   4551 |     {
   4552 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle_auth.bundle, "server");
   4553 |         if (!mLoadedModCollection)
   4554 |         {
   4555 |             ZU_Error << "GameServerImpl::loadAndMountModFileData: Unable to load mod collection from mod file data bundle";
   4556 |         }
   4557 |         else
   4558 |         {
   4559 |             result = mountMods(server_lock);
   4560 |         }
   4561 |     }
   4562 |     else
   4563 |     {
>  4564 |         ZU_Info << "GameServerImpl::loadAndMountModFileData: Ignoring mod file data due to invalid authentication token \"" << check_auth_token << "\", expected \"" << expected_auth_token << "\" (token may have been changed if mod data updates cheat is not enabled)";
   4565 |     }
   4566 | 
   4567 |     return result;
   4568 | }
   4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
   4573 |     return mMountedModCollection ? mMountedModCollection->getModsJsonArray() : Json::makeArray();
   4574 | }
   4575 | 
   4576 | ModFileDataPackageBundle GameServerImpl::getMountedModsDataPackageBundle() const
   4577 | {
   4578 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4579 | 
   4580 |     return mMountedModCollection ? mMountedModCollection->getDataPackageBundle() : ModFileDataPackageBundle();
   4581 | }
   4582 | 
   4583 | size_t GameServerImpl::getMountedModsDataPackageBundleEstimatedSize() const
   4584 | {
```

### .\libs\server\game_server.h:273
- Signature: L192:     virtual ~GameServer() { }
```cpp
    253 |     virtual void issueSelfDestruct(IssueSelfDestructData const & data) = 0;
    254 | 
    255 |     virtual void dumpHistory(std::ostream & stream) = 0;
    256 | 
    257 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, zu::Json & outInfoJson) = 0;
    258 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, zu::Json & inOutInfoJson) const = 0;
    259 |     virtual void setReplayConfig(zu::Json const & replayConfigSummaryJson, zu::Json const & replayConfigFullJson) = 0;
    260 |     virtual void setGameConfig(zu::Json const & config) = 0;
    261 |     virtual zu::Json getGameConfig() = 0;
    262 |     virtual zu::Json getReplayConfigSummary() = 0;
    263 |     virtual zu::Json getFullReplayConfig() = 0;
    264 | 
    265 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, zu::Json & outInfoJson) = 0;
    266 |     virtual void createSimFromReplay() = 0;
    267 |     virtual void trimHistoryAndStartSim(float load_time) = 0;
    268 | 
    269 |     virtual void describeHistoryStats(zu::Json desc) const = 0;
    270 | 
    271 |     virtual std::string getModUpdateAuthToken() const = 0;
    272 |     virtual void resetModUpdateAuthToken() = 0;
>   273 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) = 0;
    274 |     virtual zu::Json getMountedModsJsonArray() const = 0;
    275 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const = 0;
    276 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const = 0;
    277 | 
    278 |     virtual void toggleNavDebug() = 0;
    279 |     virtual void initDropletTest(zu::Vec3f const & position) = 0;
    280 | 
    281 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) = 0;
    282 | 
    283 | #ifdef HAVE_STEAM
    284 |     virtual void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) = 0;
    285 | #endif
    286 | };
    287 | 
    288 | class GameServer::Connection : public zu::Counted
    289 | {
    290 |   public:
    291 |     virtual std::string const & playerName() const = 0;
    292 |     virtual std::string const & playerIdentity() const = 0;
    293 |     virtual std::string const & debugDescription() const = 0;
```

### .\server\server_main.cpp:2416
- Signature: Not found within 120 lines above match
```cpp
   2396 |         {
   2397 |             Json parsedMsg;
   2398 |             try
   2399 |             {
   2400 |                 parsedMsg = parseJson(rawMsg);
   2401 |             }
   2402 |             catch (...)
   2403 |             {
   2404 |                 ZU_Error << "Invalid message received from connection " << connection->playerName() << ": " << rawMsg;
   2405 |             }
   2406 |             mServerModuleHost.getModule()->message(connection, parsedMsg);
   2407 |         }
   2408 |     }
   2409 | 
   2410 |     virtual void recvModFileData(zu::RefNoCount<GameServer::Connection> connection, ModFileDataPackageBundleAuthorized const & bundle_auth) override
   2411 |     {
   2412 |         ScopedLock lock(mMutex);
   2413 | 
   2414 |         std::string check_auth_token = bundle_auth.auth_token;
   2415 | 
>  2416 |         if (mGameServer->loadAndMountModFileData(bundle_auth))
   2417 |         {
   2418 |             Json data(Json::makeObject());
   2419 |             data.set("message_type", Json::makeString("mod_data_updated"));
   2420 |             Json payload(Json::makeObject());
   2421 |             payload.set("auth_token", Json::makeString(check_auth_token));
   2422 |             data.set("payload", payload);
   2423 | 
   2424 |             if (mServerModuleHost.getModule())
   2425 |                 mServerModuleHost.getModule()->message(connection, data);
   2426 |         }
   2427 |     }
   2428 | 
   2429 |     virtual void disconnected(RefNoCount<GameServer::Connection> connection) override
   2430 |     {
   2431 |         ScopedLock lock(mMutex);
   2432 | 
   2433 |         if (mServerModuleHost.getModule())
   2434 |             mServerModuleHost.getModule()->disconnect(connection);
   2435 |     }
   2436 | 
```

## Term: getMountedModsDataPackageBundle
- Hits: 7

### .\libs\server\game_server.cpp:557
- Signature: Not found within 120 lines above match
```cpp
    537 |             stream << "No server history!";
    538 |     }
    539 | 
    540 |     virtual void setReplayConfig(Json const & replayConfigSummaryJson, Json const & replayConfigFullJson) override;
    541 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, Json & inOutInfoJson) const override;
    542 |     virtual void setGameConfig(Json const & config) override;
    543 |     virtual Json getGameConfig() override;
    544 |     virtual Json getReplayConfigSummary() override;
    545 |     virtual Json getFullReplayConfig() override;
    546 |     virtual void describeHistoryStats(Json desc) const override;
    547 | 
    548 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, Json & outInfoJson) override;
    549 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, Json & outInfoJson) override;
    550 |     virtual void createSimFromReplay() override;
    551 |     virtual void trimHistoryAndStartSim(float load_time) override;
    552 | 
    553 |     virtual std::string getModUpdateAuthToken() const override;
    554 |     virtual void resetModUpdateAuthToken() override;
    555 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) override;
    556 |     virtual Json getMountedModsJsonArray() const override;
>   557 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const override;
    558 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const override;
    559 | 
    560 |     virtual void toggleNavDebug() override { mDriverHandle->driver->toggleNavDebug(); }
    561 |     virtual void initDropletTest(Vec3f const & position) override { mDriverHandle->driver->initDropletTest(position); }
    562 | 
    563 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) override { mRequiredContent = requiredContent; }
    564 | 
    565 | #ifdef HAVE_STEAM
    566 |     void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) override;
    567 | #endif
    568 | 
    569 |   private:
    570 | 
    571 | #ifdef HAVE_STEAM
    572 |     void pollSteamConnections();
    573 |     void acceptSteamConnection();
    574 | #endif
    575 | 
    576 |     std::unique_ptr<WorldHistory> readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson);
    577 | 
```

### .\libs\server\game_server.cpp:558
- Signature: Not found within 120 lines above match
```cpp
    538 |     }
    539 | 
    540 |     virtual void setReplayConfig(Json const & replayConfigSummaryJson, Json const & replayConfigFullJson) override;
    541 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, Json & inOutInfoJson) const override;
    542 |     virtual void setGameConfig(Json const & config) override;
    543 |     virtual Json getGameConfig() override;
    544 |     virtual Json getReplayConfigSummary() override;
    545 |     virtual Json getFullReplayConfig() override;
    546 |     virtual void describeHistoryStats(Json desc) const override;
    547 | 
    548 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, Json & outInfoJson) override;
    549 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, Json & outInfoJson) override;
    550 |     virtual void createSimFromReplay() override;
    551 |     virtual void trimHistoryAndStartSim(float load_time) override;
    552 | 
    553 |     virtual std::string getModUpdateAuthToken() const override;
    554 |     virtual void resetModUpdateAuthToken() override;
    555 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) override;
    556 |     virtual Json getMountedModsJsonArray() const override;
    557 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const override;
>   558 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const override;
    559 | 
    560 |     virtual void toggleNavDebug() override { mDriverHandle->driver->toggleNavDebug(); }
    561 |     virtual void initDropletTest(Vec3f const & position) override { mDriverHandle->driver->initDropletTest(position); }
    562 | 
    563 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) override { mRequiredContent = requiredContent; }
    564 | 
    565 | #ifdef HAVE_STEAM
    566 |     void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) override;
    567 | #endif
    568 | 
    569 |   private:
    570 | 
    571 | #ifdef HAVE_STEAM
    572 |     void pollSteamConnections();
    573 |     void acceptSteamConnection();
    574 | #endif
    575 | 
    576 |     std::unique_ptr<WorldHistory> readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson);
    577 | 
    578 |     void sendProfilerHistory(SectionData const & data, float scale, bool isSim, std::lock_guard<std::mutex> & server_lock);
```

### .\libs\server\game_server.cpp:4576
- Signature: L4576: ModFileDataPackageBundle GameServerImpl::getMountedModsDataPackageBundle() const
```cpp
   4556 |         }
   4557 |         else
   4558 |         {
   4559 |             result = mountMods(server_lock);
   4560 |         }
   4561 |     }
   4562 |     else
   4563 |     {
   4564 |         ZU_Info << "GameServerImpl::loadAndMountModFileData: Ignoring mod file data due to invalid authentication token \"" << check_auth_token << "\", expected \"" << expected_auth_token << "\" (token may have been changed if mod data updates cheat is not enabled)";
   4565 |     }
   4566 | 
   4567 |     return result;
   4568 | }
   4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
   4573 |     return mMountedModCollection ? mMountedModCollection->getModsJsonArray() : Json::makeArray();
   4574 | }
   4575 | 
>  4576 | ModFileDataPackageBundle GameServerImpl::getMountedModsDataPackageBundle() const
   4577 | {
   4578 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4579 | 
   4580 |     return mMountedModCollection ? mMountedModCollection->getDataPackageBundle() : ModFileDataPackageBundle();
   4581 | }
   4582 | 
   4583 | size_t GameServerImpl::getMountedModsDataPackageBundleEstimatedSize() const
   4584 | {
   4585 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4586 | 
   4587 |     return mMountedModCollection ? mMountedModCollection->getEstimatedSize() : 1;
   4588 | }
   4589 | 
   4590 | bool GameServerImpl::mountMods(std::unique_lock<std::mutex> & server_lock)
   4591 | {
   4592 |     ZU_ASSERT(mLoadedModCollection != nullptr); // should only call this if we know we have a loaded mod collection
   4593 | 
   4594 |     bool result = false;
   4595 | 
   4596 |     auto mfs = mSpecLib->filesystem()->isMemoryFilesystem();
```

### .\libs\server\game_server.cpp:4583
- Signature: L4583: size_t GameServerImpl::getMountedModsDataPackageBundleEstimatedSize() const
```cpp
   4563 |     {
   4564 |         ZU_Info << "GameServerImpl::loadAndMountModFileData: Ignoring mod file data due to invalid authentication token \"" << check_auth_token << "\", expected \"" << expected_auth_token << "\" (token may have been changed if mod data updates cheat is not enabled)";
   4565 |     }
   4566 | 
   4567 |     return result;
   4568 | }
   4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
   4573 |     return mMountedModCollection ? mMountedModCollection->getModsJsonArray() : Json::makeArray();
   4574 | }
   4575 | 
   4576 | ModFileDataPackageBundle GameServerImpl::getMountedModsDataPackageBundle() const
   4577 | {
   4578 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4579 | 
   4580 |     return mMountedModCollection ? mMountedModCollection->getDataPackageBundle() : ModFileDataPackageBundle();
   4581 | }
   4582 | 
>  4583 | size_t GameServerImpl::getMountedModsDataPackageBundleEstimatedSize() const
   4584 | {
   4585 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4586 | 
   4587 |     return mMountedModCollection ? mMountedModCollection->getEstimatedSize() : 1;
   4588 | }
   4589 | 
   4590 | bool GameServerImpl::mountMods(std::unique_lock<std::mutex> & server_lock)
   4591 | {
   4592 |     ZU_ASSERT(mLoadedModCollection != nullptr); // should only call this if we know we have a loaded mod collection
   4593 | 
   4594 |     bool result = false;
   4595 | 
   4596 |     auto mfs = mSpecLib->filesystem()->isMemoryFilesystem();
   4597 |     if (mfs)
   4598 |     {
   4599 |         if (mMountedModCollection)
   4600 |         {
   4601 |             mMountedModCollection->unmount();
   4602 |             mDriverHandle->driver->mountContent(mRequiredContent);
   4603 |         }
```

### .\libs\server\game_server.h:275
- Signature: L192:     virtual ~GameServer() { }
```cpp
    255 |     virtual void dumpHistory(std::ostream & stream) = 0;
    256 | 
    257 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, zu::Json & outInfoJson) = 0;
    258 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, zu::Json & inOutInfoJson) const = 0;
    259 |     virtual void setReplayConfig(zu::Json const & replayConfigSummaryJson, zu::Json const & replayConfigFullJson) = 0;
    260 |     virtual void setGameConfig(zu::Json const & config) = 0;
    261 |     virtual zu::Json getGameConfig() = 0;
    262 |     virtual zu::Json getReplayConfigSummary() = 0;
    263 |     virtual zu::Json getFullReplayConfig() = 0;
    264 | 
    265 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, zu::Json & outInfoJson) = 0;
    266 |     virtual void createSimFromReplay() = 0;
    267 |     virtual void trimHistoryAndStartSim(float load_time) = 0;
    268 | 
    269 |     virtual void describeHistoryStats(zu::Json desc) const = 0;
    270 | 
    271 |     virtual std::string getModUpdateAuthToken() const = 0;
    272 |     virtual void resetModUpdateAuthToken() = 0;
    273 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) = 0;
    274 |     virtual zu::Json getMountedModsJsonArray() const = 0;
>   275 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const = 0;
    276 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const = 0;
    277 | 
    278 |     virtual void toggleNavDebug() = 0;
    279 |     virtual void initDropletTest(zu::Vec3f const & position) = 0;
    280 | 
    281 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) = 0;
    282 | 
    283 | #ifdef HAVE_STEAM
    284 |     virtual void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) = 0;
    285 | #endif
    286 | };
    287 | 
    288 | class GameServer::Connection : public zu::Counted
    289 | {
    290 |   public:
    291 |     virtual std::string const & playerName() const = 0;
    292 |     virtual std::string const & playerIdentity() const = 0;
    293 |     virtual std::string const & debugDescription() const = 0;
    294 |     virtual std::string const & playerData() const = 0;
    295 |     virtual zu::Ref<net::GSPlayerInfo> ubernetData() const = 0;
```

### .\libs\server\game_server.h:276
- Signature: L192:     virtual ~GameServer() { }
```cpp
    256 | 
    257 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, zu::Json & outInfoJson) = 0;
    258 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, zu::Json & inOutInfoJson) const = 0;
    259 |     virtual void setReplayConfig(zu::Json const & replayConfigSummaryJson, zu::Json const & replayConfigFullJson) = 0;
    260 |     virtual void setGameConfig(zu::Json const & config) = 0;
    261 |     virtual zu::Json getGameConfig() = 0;
    262 |     virtual zu::Json getReplayConfigSummary() = 0;
    263 |     virtual zu::Json getFullReplayConfig() = 0;
    264 | 
    265 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, zu::Json & outInfoJson) = 0;
    266 |     virtual void createSimFromReplay() = 0;
    267 |     virtual void trimHistoryAndStartSim(float load_time) = 0;
    268 | 
    269 |     virtual void describeHistoryStats(zu::Json desc) const = 0;
    270 | 
    271 |     virtual std::string getModUpdateAuthToken() const = 0;
    272 |     virtual void resetModUpdateAuthToken() = 0;
    273 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) = 0;
    274 |     virtual zu::Json getMountedModsJsonArray() const = 0;
    275 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const = 0;
>   276 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const = 0;
    277 | 
    278 |     virtual void toggleNavDebug() = 0;
    279 |     virtual void initDropletTest(zu::Vec3f const & position) = 0;
    280 | 
    281 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) = 0;
    282 | 
    283 | #ifdef HAVE_STEAM
    284 |     virtual void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) = 0;
    285 | #endif
    286 | };
    287 | 
    288 | class GameServer::Connection : public zu::Counted
    289 | {
    290 |   public:
    291 |     virtual std::string const & playerName() const = 0;
    292 |     virtual std::string const & playerIdentity() const = 0;
    293 |     virtual std::string const & debugDescription() const = 0;
    294 |     virtual std::string const & playerData() const = 0;
    295 |     virtual zu::Ref<net::GSPlayerInfo> ubernetData() const = 0;
    296 | 
```

### .\libs\server\server_module.cpp:475
- Signature: L467: void ServerModule::js_client_downloadModsFromServer(v8::FunctionCallbackInfo<v8::Value> const & info)
```cpp
    455 | 
    456 | void ServerModule::js_client_giveFullVision(v8::FunctionCallbackInfo<v8::Value> const & info)
    457 | {
    458 |     auto self = getSelf(info.Data());
    459 |     auto client = self->mClients->getElementSelf(info.This());
    460 |     if (!client || !client->connection)
    461 |         return;
    462 |     zu::BitVec bits;
    463 |     bits.oneFill(0, 99); // just an arbitrarily large number of army bits
    464 |     client->connection->setArmyVisionBits(bits);
    465 | }
    466 | 
    467 | void ServerModule::js_client_downloadModsFromServer(v8::FunctionCallbackInfo<v8::Value> const & info)
    468 | {
    469 |     auto self = getSelf(info.Data());
    470 |     auto client = self->mClients->getElementSelf(info.This());
    471 |     if (!client || !client->connection)
    472 |         return;
    473 | 
    474 |     // ###chargrove $TODO $OPENQUESTION does it have to be mounted by this point? is any loaded okay? not urgent, just something to think about for the long term
>   475 |     client->connection->sendModFileData(self->mHost->getServer()->getMountedModsDataPackageBundle(), self->mHost->getServer()->getMountedModsDataPackageBundleEstimatedSize());
    476 | }
    477 | 
    478 | void ServerModule::js_get_onConnect(v8::Local<v8::String> property, v8::PropertyCallbackInfo<v8::Value> const & info)
    479 | {
    480 |     auto self = getSelf(info.Data());
    481 |     info.GetReturnValue().Set(Local<Value>::New(self->mIsolate, self->mOnConnect));
    482 | }
    483 | 
    484 | void ServerModule::js_set_onConnect(v8::Local<v8::String> property, v8::Local<v8::Value> value, v8::PropertyCallbackInfo<void> const & info)
    485 | {
    486 |     auto self = getSelf(info.Data());
    487 |     self->mOnConnect.Reset(self->mIsolate, value);
    488 | }
    489 | 
    490 | void ServerModule::js_get_onLadderGameMarkedComplete(v8::Local<v8::String> property, v8::PropertyCallbackInfo<v8::Value> const & info)
    491 | {
    492 |     auto self = getSelf(info.Data());
    493 |     info.GetReturnValue().Set(Local<Value>::New(self->mIsolate, self->mOnLadderGameMarkedComplete));
    494 | }
    495 | 
```

## Term: getMountedModsJsonArray
- Hits: 4

### .\libs\server\game_server.cpp:556
- Signature: Not found within 120 lines above match
```cpp
    536 |         else
    537 |             stream << "No server history!";
    538 |     }
    539 | 
    540 |     virtual void setReplayConfig(Json const & replayConfigSummaryJson, Json const & replayConfigFullJson) override;
    541 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, Json & inOutInfoJson) const override;
    542 |     virtual void setGameConfig(Json const & config) override;
    543 |     virtual Json getGameConfig() override;
    544 |     virtual Json getReplayConfigSummary() override;
    545 |     virtual Json getFullReplayConfig() override;
    546 |     virtual void describeHistoryStats(Json desc) const override;
    547 | 
    548 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, Json & outInfoJson) override;
    549 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, Json & outInfoJson) override;
    550 |     virtual void createSimFromReplay() override;
    551 |     virtual void trimHistoryAndStartSim(float load_time) override;
    552 | 
    553 |     virtual std::string getModUpdateAuthToken() const override;
    554 |     virtual void resetModUpdateAuthToken() override;
    555 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) override;
>   556 |     virtual Json getMountedModsJsonArray() const override;
    557 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const override;
    558 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const override;
    559 | 
    560 |     virtual void toggleNavDebug() override { mDriverHandle->driver->toggleNavDebug(); }
    561 |     virtual void initDropletTest(Vec3f const & position) override { mDriverHandle->driver->initDropletTest(position); }
    562 | 
    563 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) override { mRequiredContent = requiredContent; }
    564 | 
    565 | #ifdef HAVE_STEAM
    566 |     void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) override;
    567 | #endif
    568 | 
    569 |   private:
    570 | 
    571 | #ifdef HAVE_STEAM
    572 |     void pollSteamConnections();
    573 |     void acceptSteamConnection();
    574 | #endif
    575 | 
    576 |     std::unique_ptr<WorldHistory> readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson);
```

### .\libs\server\game_server.cpp:4569
- Signature: L4569: Json GameServerImpl::getMountedModsJsonArray() const
```cpp
   4549 | 
   4550 |     if (authorized)
   4551 |     {
   4552 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle_auth.bundle, "server");
   4553 |         if (!mLoadedModCollection)
   4554 |         {
   4555 |             ZU_Error << "GameServerImpl::loadAndMountModFileData: Unable to load mod collection from mod file data bundle";
   4556 |         }
   4557 |         else
   4558 |         {
   4559 |             result = mountMods(server_lock);
   4560 |         }
   4561 |     }
   4562 |     else
   4563 |     {
   4564 |         ZU_Info << "GameServerImpl::loadAndMountModFileData: Ignoring mod file data due to invalid authentication token \"" << check_auth_token << "\", expected \"" << expected_auth_token << "\" (token may have been changed if mod data updates cheat is not enabled)";
   4565 |     }
   4566 | 
   4567 |     return result;
   4568 | }
>  4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
   4573 |     return mMountedModCollection ? mMountedModCollection->getModsJsonArray() : Json::makeArray();
   4574 | }
   4575 | 
   4576 | ModFileDataPackageBundle GameServerImpl::getMountedModsDataPackageBundle() const
   4577 | {
   4578 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4579 | 
   4580 |     return mMountedModCollection ? mMountedModCollection->getDataPackageBundle() : ModFileDataPackageBundle();
   4581 | }
   4582 | 
   4583 | size_t GameServerImpl::getMountedModsDataPackageBundleEstimatedSize() const
   4584 | {
   4585 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4586 | 
   4587 |     return mMountedModCollection ? mMountedModCollection->getEstimatedSize() : 1;
   4588 | }
   4589 | 
```

### .\libs\server\game_server.h:274
- Signature: L192:     virtual ~GameServer() { }
```cpp
    254 | 
    255 |     virtual void dumpHistory(std::ostream & stream) = 0;
    256 | 
    257 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, zu::Json & outInfoJson) = 0;
    258 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, zu::Json & inOutInfoJson) const = 0;
    259 |     virtual void setReplayConfig(zu::Json const & replayConfigSummaryJson, zu::Json const & replayConfigFullJson) = 0;
    260 |     virtual void setGameConfig(zu::Json const & config) = 0;
    261 |     virtual zu::Json getGameConfig() = 0;
    262 |     virtual zu::Json getReplayConfigSummary() = 0;
    263 |     virtual zu::Json getFullReplayConfig() = 0;
    264 | 
    265 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, zu::Json & outInfoJson) = 0;
    266 |     virtual void createSimFromReplay() = 0;
    267 |     virtual void trimHistoryAndStartSim(float load_time) = 0;
    268 | 
    269 |     virtual void describeHistoryStats(zu::Json desc) const = 0;
    270 | 
    271 |     virtual std::string getModUpdateAuthToken() const = 0;
    272 |     virtual void resetModUpdateAuthToken() = 0;
    273 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) = 0;
>   274 |     virtual zu::Json getMountedModsJsonArray() const = 0;
    275 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const = 0;
    276 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const = 0;
    277 | 
    278 |     virtual void toggleNavDebug() = 0;
    279 |     virtual void initDropletTest(zu::Vec3f const & position) = 0;
    280 | 
    281 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) = 0;
    282 | 
    283 | #ifdef HAVE_STEAM
    284 |     virtual void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) = 0;
    285 | #endif
    286 | };
    287 | 
    288 | class GameServer::Connection : public zu::Counted
    289 | {
    290 |   public:
    291 |     virtual std::string const & playerName() const = 0;
    292 |     virtual std::string const & playerIdentity() const = 0;
    293 |     virtual std::string const & debugDescription() const = 0;
    294 |     virtual std::string const & playerData() const = 0;
```

### .\libs\server\server_module.cpp:790
- Signature: L780: void ServerModule::js_getMods(v8::FunctionCallbackInfo<v8::Value> const & info)
```cpp
    770 |         return;
    771 |     auto ctx = self->mIsolate->GetCurrentContext();
    772 |     float loadTime = (float)info[0]->NumberValue(ctx).ToChecked();
    773 |     if (loadTime < 0 && loadTime != -1)
    774 |         loadTime = -1;
    775 | 
    776 |     ZU_Info << "Script requested trimHistoryAndStartSim " << loadTime;
    777 |     self->mHost->trimHistoryAndStartSim(loadTime);
    778 | }
    779 | 
    780 | void ServerModule::js_getMods(v8::FunctionCallbackInfo<v8::Value> const & info)
    781 | {
    782 |     info.GetReturnValue().SetUndefined();
    783 | 
    784 |     auto self = getSelf(info.Data());
    785 |     auto server = self->mHost->getServer();
    786 | 
    787 |     Json json(Json::makeObject());
    788 |     json.set("auth_token", Json::makeString(server->getModUpdateAuthToken()));
    789 | 
>   790 |     auto modsJsonArray = self->mHost->getServer()->getMountedModsJsonArray();
    791 |     if (!modsJsonArray.isNull())
    792 |     {
    793 |         json.set("mounted_mods", modsJsonArray);
    794 |     }
    795 | 
    796 |     info.GetReturnValue().Set(self->mEnv->fromJson(json));
    797 | }
    798 | 
    799 | void ServerModule::js_resetModUpdateAuthToken(v8::FunctionCallbackInfo<v8::Value> const & info)
    800 | {
    801 |     info.GetReturnValue().SetUndefined();
    802 | 
    803 |     auto self = getSelf(info.Data());
    804 |     auto server = self->mHost->getServer();
    805 | 
    806 |     server->resetModUpdateAuthToken();
    807 | }
    808 | 
    809 | void ServerModule::js_markLadderGameComplete(v8::FunctionCallbackInfo<v8::Value> const & info)
    810 | {
```

## Term: getModUpdateAuthToken
- Hits: 4

### .\libs\server\game_server.cpp:553
- Signature: Not found within 120 lines above match
```cpp
    533 |         std::shared_lock<std::shared_mutex> history_lock(mServerHistoryMutex);
    534 |         if (mServerHistory)
    535 |             ::dumpHistory(&mEntityFactory, *mServerHistory, stream);
    536 |         else
    537 |             stream << "No server history!";
    538 |     }
    539 | 
    540 |     virtual void setReplayConfig(Json const & replayConfigSummaryJson, Json const & replayConfigFullJson) override;
    541 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, Json & inOutInfoJson) const override;
    542 |     virtual void setGameConfig(Json const & config) override;
    543 |     virtual Json getGameConfig() override;
    544 |     virtual Json getReplayConfigSummary() override;
    545 |     virtual Json getFullReplayConfig() override;
    546 |     virtual void describeHistoryStats(Json desc) const override;
    547 | 
    548 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, Json & outInfoJson) override;
    549 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, Json & outInfoJson) override;
    550 |     virtual void createSimFromReplay() override;
    551 |     virtual void trimHistoryAndStartSim(float load_time) override;
    552 | 
>   553 |     virtual std::string getModUpdateAuthToken() const override;
    554 |     virtual void resetModUpdateAuthToken() override;
    555 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) override;
    556 |     virtual Json getMountedModsJsonArray() const override;
    557 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const override;
    558 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const override;
    559 | 
    560 |     virtual void toggleNavDebug() override { mDriverHandle->driver->toggleNavDebug(); }
    561 |     virtual void initDropletTest(Vec3f const & position) override { mDriverHandle->driver->initDropletTest(position); }
    562 | 
    563 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) override { mRequiredContent = requiredContent; }
    564 | 
    565 | #ifdef HAVE_STEAM
    566 |     void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) override;
    567 | #endif
    568 | 
    569 |   private:
    570 | 
    571 | #ifdef HAVE_STEAM
    572 |     void pollSteamConnections();
    573 |     void acceptSteamConnection();
```

### .\libs\server\game_server.cpp:4519
- Signature: L4519: std::string GameServerImpl::getModUpdateAuthToken() const
```cpp
   4499 |     if (mHistoryServer)
   4500 |         mHistoryServer->collectStats(stats.child("clients"), mEntityFactory);
   4501 | 
   4502 |     server_lock.unlock();
   4503 | 
   4504 |     {
   4505 |         std::lock_guard<std::mutex> history_lock(mStageHistoryMutex);
   4506 |         if (mStageHistory)
   4507 |             mStageHistory->collectStats(stats.child("stage"), mEntityFactory);
   4508 |     }
   4509 | 
   4510 |     if (have_sim)
   4511 |     {
   4512 |         sim_done.wait();
   4513 |         stats.child("sim") = std::move(sim_stats);
   4514 |     }
   4515 | 
   4516 |     desc.set("all_history", stats.toJson());
   4517 | }
   4518 | 
>  4519 | std::string GameServerImpl::getModUpdateAuthToken() const
   4520 | {
   4521 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4522 | 
   4523 |     return mModUpdateAuthToken;
   4524 | }
   4525 | 
   4526 | void GameServerImpl::resetModUpdateAuthToken()
   4527 | {
   4528 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4529 | 
   4530 |     mModUpdateAuthToken = UUID::random().toString();
   4531 |     ZU_Info << "GameServerImpl::resetModUpdateAuthToken: Auth token reset to \"" << mModUpdateAuthToken << "\"";
   4532 | }
   4533 | 
   4534 | bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
   4535 | {
   4536 |     std::unique_lock<std::mutex> server_lock(mServerMutex);
   4537 | 
   4538 |     bool result = false;
   4539 |     bool authorized = true;
```

### .\libs\server\game_server.h:271
- Signature: L192:     virtual ~GameServer() { }
```cpp
    251 |     virtual void issueMove(IssueTargetedOrderData const & data) = 0;
    252 |     virtual void issuePatrol(IssueTargetedOrderData const & data) = 0;
    253 |     virtual void issueSelfDestruct(IssueSelfDestructData const & data) = 0;
    254 | 
    255 |     virtual void dumpHistory(std::ostream & stream) = 0;
    256 | 
    257 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, zu::Json & outInfoJson) = 0;
    258 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, zu::Json & inOutInfoJson) const = 0;
    259 |     virtual void setReplayConfig(zu::Json const & replayConfigSummaryJson, zu::Json const & replayConfigFullJson) = 0;
    260 |     virtual void setGameConfig(zu::Json const & config) = 0;
    261 |     virtual zu::Json getGameConfig() = 0;
    262 |     virtual zu::Json getReplayConfigSummary() = 0;
    263 |     virtual zu::Json getFullReplayConfig() = 0;
    264 | 
    265 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, zu::Json & outInfoJson) = 0;
    266 |     virtual void createSimFromReplay() = 0;
    267 |     virtual void trimHistoryAndStartSim(float load_time) = 0;
    268 | 
    269 |     virtual void describeHistoryStats(zu::Json desc) const = 0;
    270 | 
>   271 |     virtual std::string getModUpdateAuthToken() const = 0;
    272 |     virtual void resetModUpdateAuthToken() = 0;
    273 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) = 0;
    274 |     virtual zu::Json getMountedModsJsonArray() const = 0;
    275 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const = 0;
    276 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const = 0;
    277 | 
    278 |     virtual void toggleNavDebug() = 0;
    279 |     virtual void initDropletTest(zu::Vec3f const & position) = 0;
    280 | 
    281 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) = 0;
    282 | 
    283 | #ifdef HAVE_STEAM
    284 |     virtual void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) = 0;
    285 | #endif
    286 | };
    287 | 
    288 | class GameServer::Connection : public zu::Counted
    289 | {
    290 |   public:
    291 |     virtual std::string const & playerName() const = 0;
```

### .\libs\server\server_module.cpp:788
- Signature: L780: void ServerModule::js_getMods(v8::FunctionCallbackInfo<v8::Value> const & info)
```cpp
    768 |     auto self = getSelf(info.Data());
    769 |     if (info.Length() < 1)
    770 |         return;
    771 |     auto ctx = self->mIsolate->GetCurrentContext();
    772 |     float loadTime = (float)info[0]->NumberValue(ctx).ToChecked();
    773 |     if (loadTime < 0 && loadTime != -1)
    774 |         loadTime = -1;
    775 | 
    776 |     ZU_Info << "Script requested trimHistoryAndStartSim " << loadTime;
    777 |     self->mHost->trimHistoryAndStartSim(loadTime);
    778 | }
    779 | 
    780 | void ServerModule::js_getMods(v8::FunctionCallbackInfo<v8::Value> const & info)
    781 | {
    782 |     info.GetReturnValue().SetUndefined();
    783 | 
    784 |     auto self = getSelf(info.Data());
    785 |     auto server = self->mHost->getServer();
    786 | 
    787 |     Json json(Json::makeObject());
>   788 |     json.set("auth_token", Json::makeString(server->getModUpdateAuthToken()));
    789 | 
    790 |     auto modsJsonArray = self->mHost->getServer()->getMountedModsJsonArray();
    791 |     if (!modsJsonArray.isNull())
    792 |     {
    793 |         json.set("mounted_mods", modsJsonArray);
    794 |     }
    795 | 
    796 |     info.GetReturnValue().Set(self->mEnv->fromJson(json));
    797 | }
    798 | 
    799 | void ServerModule::js_resetModUpdateAuthToken(v8::FunctionCallbackInfo<v8::Value> const & info)
    800 | {
    801 |     info.GetReturnValue().SetUndefined();
    802 | 
    803 |     auto self = getSelf(info.Data());
    804 |     auto server = self->mHost->getServer();
    805 | 
    806 |     server->resetModUpdateAuthToken();
    807 | }
    808 | 
```

## Term: mod_data_updated
- Hits: 1

### .\server\server_main.cpp:2419
- Signature: Not found within 120 lines above match
```cpp
   2399 |             {
   2400 |                 parsedMsg = parseJson(rawMsg);
   2401 |             }
   2402 |             catch (...)
   2403 |             {
   2404 |                 ZU_Error << "Invalid message received from connection " << connection->playerName() << ": " << rawMsg;
   2405 |             }
   2406 |             mServerModuleHost.getModule()->message(connection, parsedMsg);
   2407 |         }
   2408 |     }
   2409 | 
   2410 |     virtual void recvModFileData(zu::RefNoCount<GameServer::Connection> connection, ModFileDataPackageBundleAuthorized const & bundle_auth) override
   2411 |     {
   2412 |         ScopedLock lock(mMutex);
   2413 | 
   2414 |         std::string check_auth_token = bundle_auth.auth_token;
   2415 | 
   2416 |         if (mGameServer->loadAndMountModFileData(bundle_auth))
   2417 |         {
   2418 |             Json data(Json::makeObject());
>  2419 |             data.set("message_type", Json::makeString("mod_data_updated"));
   2420 |             Json payload(Json::makeObject());
   2421 |             payload.set("auth_token", Json::makeString(check_auth_token));
   2422 |             data.set("payload", payload);
   2423 | 
   2424 |             if (mServerModuleHost.getModule())
   2425 |                 mServerModuleHost.getModule()->message(connection, data);
   2426 |         }
   2427 |     }
   2428 | 
   2429 |     virtual void disconnected(RefNoCount<GameServer::Connection> connection) override
   2430 |     {
   2431 |         ScopedLock lock(mMutex);
   2432 | 
   2433 |         if (mServerModuleHost.getModule())
   2434 |             mServerModuleHost.getModule()->disconnect(connection);
   2435 |     }
   2436 | 
   2437 |     virtual void simShutdownFinished() override
   2438 |     {
   2439 |         ScopedLock lock(mMutex);
```

## Term: mod_data_received
- Hits: 1

### .\client\client_game.cpp:3560
- Signature: L3543: void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
```cpp
   3540 | {
   3541 | }
   3542 | 
   3543 | void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
   3544 | {
   3545 |     auto modCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle, "server");
   3546 |     if (modCollection != nullptr)
   3547 |     {
   3548 |         mServerLoadedRemoteModCollection = modCollection;
   3549 | 
   3550 |         // we mount as soon as we download the bundle (since the bundle is coming from the server so it's expecting us to use it)
   3551 |         mountServerMods();
   3552 | 
   3553 |         // mounting mods resets the spec lib if we're using one, but that reset may be queued up and we don't want to
   3554 |         //   send our response message until after this has occurred.
   3555 | 
   3556 |         platform()->getUIThreadTaskQueue()->enqueue(
   3557 |             [=]()
   3558 |             {
   3559 |                 Json data(Json::makeObject());
>  3560 |                 data.set("message_type", Json::makeString("mod_data_received"));
   3561 |                 Json payload(Json::makeObject());
   3562 |                 // payload.set("auth_token", Json::makeString(auth_token));
   3563 |                 data.set("payload", payload);
   3564 | 
   3565 |                 connSendMessage(data.asString());
   3566 |             });
   3567 |     }
   3568 | }
   3569 | 
   3570 | void ClientGame::connection_GameConfig(GameConfig const& config)
   3571 | {
   3572 |     HProfiler_FnZone();
   3573 | 
   3574 |     ZU_Info << __FUNCTION__;
   3575 | 
   3576 |     mDeferredGameConfig.reset(new GameConfig(config));
   3577 | }
   3578 | 
   3579 | void ClientGame::connection_SimCreated()
   3580 | {
```

## Term: max size, estimated size, compress (bundle limits)
- Hits: 162

### .\client\client_connection.cpp:165
- Signature: L165: void ConnectionToServer::sendModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth, size_t estimated_size)
```cpp
    145 |         }
    146 |     }
    147 | 
    148 |     if (activePipe())
    149 |         activePipe()->flush();
    150 | }
    151 | 
    152 | void ConnectionToServer::sendMessage(Json const & json)
    153 | {
    154 |     std::stringstream s;
    155 |     s << json;
    156 |     sendMessage(s.str());
    157 | }
    158 | 
    159 | void ConnectionToServer::sendMessage(StringRange str)
    160 | {
    161 |     if (mCommandEndpoint)
    162 |         mCommandEndpoint->sendUp(GameServerCommand::makeMessage(str.toString()), str.size() + 4);
    163 | }
    164 | 
>   165 | void ConnectionToServer::sendModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth, size_t estimated_size)
    166 | {
    167 |     if (mCommandEndpoint)
    168 |         mCommandEndpoint->sendUp(GameServerCommand::makeUploadModFileData(bundle_auth), estimated_size);
    169 | }
    170 | 
    171 | void ConnectionToServer::connect(float dt)
    172 | {
    173 |     assert(!mCommandEndpoint);
    174 | 
    175 |     mNextConnect -= dt;
    176 |     if (mNextConnect > 0)
    177 |         return;
    178 | 
    179 | #ifdef HAVE_STEAM
    180 |     if (mServerSteamId != 0)
    181 |     {
    182 |         SteamNetworkingIdentity identity;
    183 |         identity.SetSteamID64(mServerSteamId);
    184 |         HSteamNetConnection conn = SteamNetworkingSockets()->ConnectP2P(identity, 0, 0, nullptr);
    185 |         if (conn == k_HSteamNetConnection_Invalid)
```

### .\client\client_connection.cpp:168
- Signature: L165: void ConnectionToServer::sendModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth, size_t estimated_size)
```cpp
    148 |     if (activePipe())
    149 |         activePipe()->flush();
    150 | }
    151 | 
    152 | void ConnectionToServer::sendMessage(Json const & json)
    153 | {
    154 |     std::stringstream s;
    155 |     s << json;
    156 |     sendMessage(s.str());
    157 | }
    158 | 
    159 | void ConnectionToServer::sendMessage(StringRange str)
    160 | {
    161 |     if (mCommandEndpoint)
    162 |         mCommandEndpoint->sendUp(GameServerCommand::makeMessage(str.toString()), str.size() + 4);
    163 | }
    164 | 
    165 | void ConnectionToServer::sendModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth, size_t estimated_size)
    166 | {
    167 |     if (mCommandEndpoint)
>   168 |         mCommandEndpoint->sendUp(GameServerCommand::makeUploadModFileData(bundle_auth), estimated_size);
    169 | }
    170 | 
    171 | void ConnectionToServer::connect(float dt)
    172 | {
    173 |     assert(!mCommandEndpoint);
    174 | 
    175 |     mNextConnect -= dt;
    176 |     if (mNextConnect > 0)
    177 |         return;
    178 | 
    179 | #ifdef HAVE_STEAM
    180 |     if (mServerSteamId != 0)
    181 |     {
    182 |         SteamNetworkingIdentity identity;
    183 |         identity.SetSteamID64(mServerSteamId);
    184 |         HSteamNetConnection conn = SteamNetworkingSockets()->ConnectP2P(identity, 0, 0, nullptr);
    185 |         if (conn == k_HSteamNetConnection_Invalid)
    186 |         {
    187 |             mConnectionAttempts++;
    188 |             if (mConnectionAttempts > MAX_RETRIES)
```

### .\client\client_connection.cpp:449
- Signature: L449: bool ConnectionToServer::processDownloadModFileData(ModFileDataPackageBundle const & bundle)
```cpp
    429 | bool ConnectionToServer::processProfilerStats(std::vector<uint8_t> const & data, bool isSim)
    430 | {
    431 |     net::Message msg(data.size());
    432 | //    msg.bytes = data;
    433 | 
    434 |     memcpy(msg.bytes, data.data(), data.size());
    435 | 
    436 |     msg.size = data.size();
    437 | 
    438 |     net::MessageReader reader(&msg);
    439 | 
    440 |     SectionData& section = isSim ? mSimStats : mServerStats;
    441 |     float& scale = isSim ? mSimScale : mServerScale;
    442 |     section.reset();
    443 |     decodeValue( scale, reader );
    444 |     decodeValue( section, mStatStrings, reader );
    445 |     mCallbacks->connection_ProfilerStatsUpdated();
    446 |     return true;
    447 | }
    448 | 
>   449 | bool ConnectionToServer::processDownloadModFileData(ModFileDataPackageBundle const & bundle)
    450 | {
    451 |     mCallbacks->connection_DownloadModFileData(bundle);
    452 |     return true;
    453 | }
    454 | 
    455 | bool ConnectionToServer::processCommand(GameClientCommand const & msg)
    456 | {
    457 |     switch (msg.tag())
    458 |     {
    459 |         case GameClientCommand::Tags::SimCreated:
    460 |             return processSimCreated(msg.getSimCreated());
    461 |         case GameClientCommand::Tags::SimTerminated:
    462 |             return processSimTerminated(msg.getSimTerminated());
    463 |         case GameClientCommand::Tags::ServerStats:
    464 |             return processProfilerStats(msg.getServerStats(), false);
    465 |         case GameClientCommand::Tags::SimStats:
    466 |             return processProfilerStats(msg.getSimStats(), true);
    467 |         case GameClientCommand::Tags::Message:
    468 |             return processMessage(msg.getMessage());
    469 |         case GameClientCommand::Tags::VisionBits:
```

### .\client\client_connection.cpp:451
- Signature: L449: bool ConnectionToServer::processDownloadModFileData(ModFileDataPackageBundle const & bundle)
```cpp
    431 |     net::Message msg(data.size());
    432 | //    msg.bytes = data;
    433 | 
    434 |     memcpy(msg.bytes, data.data(), data.size());
    435 | 
    436 |     msg.size = data.size();
    437 | 
    438 |     net::MessageReader reader(&msg);
    439 | 
    440 |     SectionData& section = isSim ? mSimStats : mServerStats;
    441 |     float& scale = isSim ? mSimScale : mServerScale;
    442 |     section.reset();
    443 |     decodeValue( scale, reader );
    444 |     decodeValue( section, mStatStrings, reader );
    445 |     mCallbacks->connection_ProfilerStatsUpdated();
    446 |     return true;
    447 | }
    448 | 
    449 | bool ConnectionToServer::processDownloadModFileData(ModFileDataPackageBundle const & bundle)
    450 | {
>   451 |     mCallbacks->connection_DownloadModFileData(bundle);
    452 |     return true;
    453 | }
    454 | 
    455 | bool ConnectionToServer::processCommand(GameClientCommand const & msg)
    456 | {
    457 |     switch (msg.tag())
    458 |     {
    459 |         case GameClientCommand::Tags::SimCreated:
    460 |             return processSimCreated(msg.getSimCreated());
    461 |         case GameClientCommand::Tags::SimTerminated:
    462 |             return processSimTerminated(msg.getSimTerminated());
    463 |         case GameClientCommand::Tags::ServerStats:
    464 |             return processProfilerStats(msg.getServerStats(), false);
    465 |         case GameClientCommand::Tags::SimStats:
    466 |             return processProfilerStats(msg.getSimStats(), true);
    467 |         case GameClientCommand::Tags::Message:
    468 |             return processMessage(msg.getMessage());
    469 |         case GameClientCommand::Tags::VisionBits:
    470 |             return processVisionBits(msg.getVisionBits());
    471 |         case GameClientCommand::Tags::ControlBits:
```

### .\client\client_connection.h:32
- Signature: Not found within 120 lines above match
```cpp
     12 | #include <engine/crom/profiler.h>
     13 | 
     14 | #include <engine/zu/symbol.h>
     15 | 
     16 | #ifdef HAVE_STEAM
     17 | #include <engine/net/steam_msgpipe.h>
     18 | #endif
     19 | 
     20 | #if defined(PLATFORM_LINUX) || defined(PLATFORM_DARWIN)
     21 | #include <unistd.h>
     22 | #endif
     23 | 
     24 | namespace netutil
     25 | {
     26 |     class MsgPipeBuffer;
     27 |     class UberProtoPipe;
     28 | }
     29 | 
     30 | struct GameClientCommand;
     31 | struct SimCreatedData;
>    32 | struct ModFileDataPackageBundle;
     33 | struct ModFileDataPackageBundleAuthorized;
     34 | 
     35 | namespace client
     36 | {
     37 |     class ConnectionToServerCallbacks
     38 |     {
     39 |       public:
     40 |         virtual void connection_ConnectionFailed() = 0;
     41 |         virtual void connection_LoginAccepted(std::string version, std::string buildid, size_t replayVersion) = 0;
     42 |         virtual void connection_LoginRejected() = 0;
     43 |         virtual void connection_Message(zu::Json const & json) = 0;
     44 |         virtual void connection_ProfilerStatsUpdated() = 0;
     45 |         virtual void connection_VisionBits(BitVectorData const & data) = 0;
     46 |         virtual void connection_ControlBits(BitVectorData const & data) = 0;
     47 |         virtual void connection_DownloadModFileData(ModFileDataPackageBundle const & bundle) = 0;
     48 |         virtual void connection_GameConfig(GameConfig const & config) = 0;
     49 |         virtual void connection_SimCreated() = 0;
     50 |         virtual void connection_SimTerminated() = 0;
     51 |         virtual void connection_Disconnected() = 0;
     52 |         virtual ~ConnectionToServerCallbacks() {}
```

### .\client\client_connection.h:33
- Signature: Not found within 120 lines above match
```cpp
     13 | 
     14 | #include <engine/zu/symbol.h>
     15 | 
     16 | #ifdef HAVE_STEAM
     17 | #include <engine/net/steam_msgpipe.h>
     18 | #endif
     19 | 
     20 | #if defined(PLATFORM_LINUX) || defined(PLATFORM_DARWIN)
     21 | #include <unistd.h>
     22 | #endif
     23 | 
     24 | namespace netutil
     25 | {
     26 |     class MsgPipeBuffer;
     27 |     class UberProtoPipe;
     28 | }
     29 | 
     30 | struct GameClientCommand;
     31 | struct SimCreatedData;
     32 | struct ModFileDataPackageBundle;
>    33 | struct ModFileDataPackageBundleAuthorized;
     34 | 
     35 | namespace client
     36 | {
     37 |     class ConnectionToServerCallbacks
     38 |     {
     39 |       public:
     40 |         virtual void connection_ConnectionFailed() = 0;
     41 |         virtual void connection_LoginAccepted(std::string version, std::string buildid, size_t replayVersion) = 0;
     42 |         virtual void connection_LoginRejected() = 0;
     43 |         virtual void connection_Message(zu::Json const & json) = 0;
     44 |         virtual void connection_ProfilerStatsUpdated() = 0;
     45 |         virtual void connection_VisionBits(BitVectorData const & data) = 0;
     46 |         virtual void connection_ControlBits(BitVectorData const & data) = 0;
     47 |         virtual void connection_DownloadModFileData(ModFileDataPackageBundle const & bundle) = 0;
     48 |         virtual void connection_GameConfig(GameConfig const & config) = 0;
     49 |         virtual void connection_SimCreated() = 0;
     50 |         virtual void connection_SimTerminated() = 0;
     51 |         virtual void connection_Disconnected() = 0;
     52 |         virtual ~ConnectionToServerCallbacks() {}
     53 |     };
```

### .\client\client_connection.h:47
- Signature: Not found within 120 lines above match
```cpp
     27 |     class UberProtoPipe;
     28 | }
     29 | 
     30 | struct GameClientCommand;
     31 | struct SimCreatedData;
     32 | struct ModFileDataPackageBundle;
     33 | struct ModFileDataPackageBundleAuthorized;
     34 | 
     35 | namespace client
     36 | {
     37 |     class ConnectionToServerCallbacks
     38 |     {
     39 |       public:
     40 |         virtual void connection_ConnectionFailed() = 0;
     41 |         virtual void connection_LoginAccepted(std::string version, std::string buildid, size_t replayVersion) = 0;
     42 |         virtual void connection_LoginRejected() = 0;
     43 |         virtual void connection_Message(zu::Json const & json) = 0;
     44 |         virtual void connection_ProfilerStatsUpdated() = 0;
     45 |         virtual void connection_VisionBits(BitVectorData const & data) = 0;
     46 |         virtual void connection_ControlBits(BitVectorData const & data) = 0;
>    47 |         virtual void connection_DownloadModFileData(ModFileDataPackageBundle const & bundle) = 0;
     48 |         virtual void connection_GameConfig(GameConfig const & config) = 0;
     49 |         virtual void connection_SimCreated() = 0;
     50 |         virtual void connection_SimTerminated() = 0;
     51 |         virtual void connection_Disconnected() = 0;
     52 |         virtual ~ConnectionToServerCallbacks() {}
     53 |     };
     54 | 
     55 | 
     56 |     class ConnectionToServer
     57 |     {
     58 |         net::SocketFactory * const mSocketFactory;
     59 |         zu::AlarmClock * const mAlarmClock;
     60 |         std::string const mServerName;
     61 |         uint16_t mServerPort;
     62 |         std::string const mPlayerName;
     63 |         std::string const mPlayerIdentity; /* this should no longer be used. instead use the uber id (encoded in the ticket) */
     64 |         std::string const mTicket;
     65 |         std::string const mPlayerData;
     66 |         ConnectionToServerCallbacks * const mCallbacks;
     67 |         zu::TaskQueue * mCallbackQueue;
```

### .\client\client_connection.h:147
- Signature: L142:         float simScale() const { return mSimScale; }
```cpp
    127 |                                     uint64_t server_steam_id = 0);
    128 | 
    129 |         ~ConnectionToServer();
    130 | 
    131 |         void update(float dt);
    132 | 
    133 |         bool connected() const { return mState == STATE_Connected; }
    134 |         bool live() const { return mState != STATE_Disconnected; }
    135 | 
    136 |         netutil::UberProtoPipe * cmdPipe() { return mCommandEndpoint.get(); }
    137 |         HistoryViewer * historyViewer() const { return mHistoryViewer.get(); }
    138 | 
    139 |         crom::SectionData const & serverStats() const { return mServerStats; }
    140 |         crom::SectionData const & simStats() const { return mSimStats; }
    141 |         float serverScale() const { return mServerScale; }
    142 |         float simScale() const { return mSimScale; }
    143 | 
    144 |         void sendMessage(zu::Json const & msg);
    145 |         void sendMessage(zu::StringRange msg);
    146 | 
>   147 |         void sendModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth, size_t estiamted_size);
    148 | 
    149 |       private:
    150 | 
    151 |         net::MsgPipe * activePipe() const;
    152 | 
    153 |         void initialize();
    154 | 
    155 |         void connect(float dt);
    156 |         void updateConnection(float dt);
    157 | 
    158 |         bool sendLogin();
    159 |         
    160 |         void processConnectionResult(net::ConnectResult res);
    161 |         bool processLoginResponse();
    162 |         bool processSimCreated(SimCreatedData const & data);
    163 |         bool processSimTerminated(SimTerminatedData const & data);
    164 |         bool processProfilerStats(std::vector<uint8_t> const & data, bool isSim);
    165 |         bool processMessage(std::string const & data);
    166 |         bool processVisionBits(BitVectorData const & data);
    167 |         bool processControlBits(BitVectorData const & data);
```

### .\client\client_connection.h:168
- Signature: L142:         float simScale() const { return mSimScale; }
```cpp
    148 | 
    149 |       private:
    150 | 
    151 |         net::MsgPipe * activePipe() const;
    152 | 
    153 |         void initialize();
    154 | 
    155 |         void connect(float dt);
    156 |         void updateConnection(float dt);
    157 | 
    158 |         bool sendLogin();
    159 |         
    160 |         void processConnectionResult(net::ConnectResult res);
    161 |         bool processLoginResponse();
    162 |         bool processSimCreated(SimCreatedData const & data);
    163 |         bool processSimTerminated(SimTerminatedData const & data);
    164 |         bool processProfilerStats(std::vector<uint8_t> const & data, bool isSim);
    165 |         bool processMessage(std::string const & data);
    166 |         bool processVisionBits(BitVectorData const & data);
    167 |         bool processControlBits(BitVectorData const & data);
>   168 |         bool processDownloadModFileData(ModFileDataPackageBundle const & bundle);
    169 |         bool processCommand(GameClientCommand const & msg);
    170 |         void processDisconnect();
    171 | 
    172 |         void updateHistoryViewer(float dt);
    173 |     };
    174 | }
    175 | 
    176 | #endif // PA_CLIENT_CONNECTION_TO_SERVER
```

### .\client\client_game.cpp:27
- Signature: Not found within 120 lines above match
```cpp
      7 | #include <engine/game/game.h>
      8 | #include <engine/game/log_policy.h>
      9 | #include <libs/coherentutil/coherent_bind_func.h>
     10 | #include <libs/coherentutil/coherent_errors.h>
     11 | #include <libs/coherentutil/coherentutil.h>
     12 | #include <libs/paent/pa_history.h>
     13 | #include <libs/paent/stats_viewpoint.h>
     14 | #include <libs/planet/planet_names.h>
     15 | 
     16 | #include "client.h"
     17 | #include "client_blip.h"
     18 | #include "client_connection.h"
     19 | #include "client_env.h"
     20 | #include "client_errors.h"
     21 | #include "client_icon_atlas.h"
     22 | #include "client_interface.h"
     23 | #include "client_planet.h"
     24 | #include "client_unit.h"
     25 | #include "client_view.h"
     26 | #include "command_line_options.h"
>    27 | #include "content_bundler.h"
     28 | #include "holodeck.h"
     29 | #include "landing_zone.h"
     30 | #include "message_handlers.h"
     31 | #include "music_system.h"
     32 | 
     33 | #include "server_process.h"
     34 | #include "steam_stats.h"
     35 | #include "system_editor_view.h"
     36 | #include "task_queue_staller.h"
     37 | #ifdef HAVE_FMOD
     38 | #include <engine/crom/fmodaudiowrapper.h>
     39 | #endif
     40 | #include <engine/crom/json_format.h>
     41 | #include <engine/crom/keycodes.h>
     42 | #include <engine/crom/memory_filesystem.h>
     43 | #include <engine/crom/miniz.h>
     44 | #include <engine/crom/mod_file_data_package_bundle_authorized.h>
     45 | #include <engine/crom/mod_util.h>
     46 | #include <engine/crom/nullaudiowrapper.h>
     47 | #include <engine/crom/options.h>
```

### .\client\client_game.cpp:44
- Signature: Not found within 120 lines above match
```cpp
     24 | #include "client_unit.h"
     25 | #include "client_view.h"
     26 | #include "command_line_options.h"
     27 | #include "content_bundler.h"
     28 | #include "holodeck.h"
     29 | #include "landing_zone.h"
     30 | #include "message_handlers.h"
     31 | #include "music_system.h"
     32 | 
     33 | #include "server_process.h"
     34 | #include "steam_stats.h"
     35 | #include "system_editor_view.h"
     36 | #include "task_queue_staller.h"
     37 | #ifdef HAVE_FMOD
     38 | #include <engine/crom/fmodaudiowrapper.h>
     39 | #endif
     40 | #include <engine/crom/json_format.h>
     41 | #include <engine/crom/keycodes.h>
     42 | #include <engine/crom/memory_filesystem.h>
     43 | #include <engine/crom/miniz.h>
>    44 | #include <engine/crom/mod_file_data_package_bundle_authorized.h>
     45 | #include <engine/crom/mod_util.h>
     46 | #include <engine/crom/nullaudiowrapper.h>
     47 | #include <engine/crom/options.h>
     48 | #include <engine/crom/papa_format.h>
     49 | #include <engine/crom/png_format.h>
     50 | #include <engine/crom/profiler.h>
     51 | #include <engine/crom/rasterizer.h>
     52 | #include <engine/crom/settings_db.h>
     53 | #include <engine/net/curl_http_request.h>
     54 | #include <engine/net/lanbeacon.h>
     55 | #include <engine/zu/MD5.h>
     56 | #include <engine/zu/arrayutil.h>
     57 | #include <engine/zu/base64.h>
     58 | #include <engine/zu/cmd_line.h>
     59 | #include <engine/zu/crash.h>
     60 | #include <engine/zu/json_util.h>
     61 | #include <engine/zu/log.h>
     62 | #include <engine/zu/logsink.h>
     63 | #include <engine/zu/osutil.h>
     64 | #include <engine/zu/pathutil.h>
```

### .\client\client_game.cpp:124
- Signature: Not found within 120 lines above match
```cpp
    104 | #ifdef PLATFORM_WINDOWS
    105 | #if defined(_DEBUG)
    106 | #define SERVER_EXE "server_debug.exe"
    107 | #else
    108 | #define SERVER_EXE "server.exe"
    109 | #endif
    110 | #elif defined(__has_feature)
    111 | #if __has_feature(address_sanitizer)
    112 | #define SERVER_EXE "server_asan"
    113 | #else
    114 | #define SERVER_EXE "server"
    115 | #endif
    116 | #else
    117 | #define SERVER_EXE "server"
    118 | #endif
    119 | 
    120 | using namespace client;
    121 | using namespace crom;
    122 | using namespace zu;
    123 | 
>   124 | // minimum replay version from server to enable server mod compression
    125 | static const size_t LZ4_REPLAY_VERSION = 2;
    126 | 
    127 | typedef std::map<ras::Rasterizer::Vendor, std::string> VendorMap;
    128 | static const VendorMap::value_type vendorMapData[] = {
    129 |     VendorMap::value_type(ras::Rasterizer::Vendor::VendorAMDATI, "amdati"),
    130 |     VendorMap::value_type(ras::Rasterizer::Vendor::VendorNVidia, "nvidia"),
    131 |     VendorMap::value_type(ras::Rasterizer::Vendor::VendorIntel, "intel"),
    132 |     VendorMap::value_type(ras::Rasterizer::Vendor::VendorOther, "other"),
    133 | };
    134 | static const VendorMap s_VendorMapping(vendorMapData, vendorMapData + ZU_ARRAY_SIZE(vendorMapData));
    135 | 
    136 | typedef std::map<std::string, ren::Visualization> VisualizationMap;
    137 | static const VisualizationMap::value_type vizMapData[] = {
    138 |     VisualizationMap::value_type("default", ren::Visualize_Normal),      VisualizationMap::value_type("wireframe", ren::Visualize_Wireframe),
    139 |     VisualizationMap::value_type("VTMips", ren::Visualize_VTMips),       VisualizationMap::value_type("VTPage", ren::Visualize_VTPage),
    140 |     VisualizationMap::value_type("albedo", ren::Visualize_AlbedoBuffer), VisualizationMap::value_type("normal", ren::Visualize_NormalBuffer),
    141 |     VisualizationMap::value_type("depth", ren::Visualize_DepthBuffer),   VisualizationMap::value_type("gbuffer", ren::Visualize_GBuffer),
    142 |     VisualizationMap::value_type("bright", ren::Visualize_BrightPass),   VisualizationMap::value_type("luminance", ren::Visualize_Luminance),
    143 |     VisualizationMap::value_type("nobloom", ren::Visualize_NoBloom),     VisualizationMap::value_type("ssao", ren::Visualize_SSAO),
    144 |     VisualizationMap::value_type("vtc", ren::Visualize_VTCache),
```

### .\client\client_game.cpp:125
- Signature: Not found within 120 lines above match
```cpp
    105 | #if defined(_DEBUG)
    106 | #define SERVER_EXE "server_debug.exe"
    107 | #else
    108 | #define SERVER_EXE "server.exe"
    109 | #endif
    110 | #elif defined(__has_feature)
    111 | #if __has_feature(address_sanitizer)
    112 | #define SERVER_EXE "server_asan"
    113 | #else
    114 | #define SERVER_EXE "server"
    115 | #endif
    116 | #else
    117 | #define SERVER_EXE "server"
    118 | #endif
    119 | 
    120 | using namespace client;
    121 | using namespace crom;
    122 | using namespace zu;
    123 | 
    124 | // minimum replay version from server to enable server mod compression
>   125 | static const size_t LZ4_REPLAY_VERSION = 2;
    126 | 
    127 | typedef std::map<ras::Rasterizer::Vendor, std::string> VendorMap;
    128 | static const VendorMap::value_type vendorMapData[] = {
    129 |     VendorMap::value_type(ras::Rasterizer::Vendor::VendorAMDATI, "amdati"),
    130 |     VendorMap::value_type(ras::Rasterizer::Vendor::VendorNVidia, "nvidia"),
    131 |     VendorMap::value_type(ras::Rasterizer::Vendor::VendorIntel, "intel"),
    132 |     VendorMap::value_type(ras::Rasterizer::Vendor::VendorOther, "other"),
    133 | };
    134 | static const VendorMap s_VendorMapping(vendorMapData, vendorMapData + ZU_ARRAY_SIZE(vendorMapData));
    135 | 
    136 | typedef std::map<std::string, ren::Visualization> VisualizationMap;
    137 | static const VisualizationMap::value_type vizMapData[] = {
    138 |     VisualizationMap::value_type("default", ren::Visualize_Normal),      VisualizationMap::value_type("wireframe", ren::Visualize_Wireframe),
    139 |     VisualizationMap::value_type("VTMips", ren::Visualize_VTMips),       VisualizationMap::value_type("VTPage", ren::Visualize_VTPage),
    140 |     VisualizationMap::value_type("albedo", ren::Visualize_AlbedoBuffer), VisualizationMap::value_type("normal", ren::Visualize_NormalBuffer),
    141 |     VisualizationMap::value_type("depth", ren::Visualize_DepthBuffer),   VisualizationMap::value_type("gbuffer", ren::Visualize_GBuffer),
    142 |     VisualizationMap::value_type("bright", ren::Visualize_BrightPass),   VisualizationMap::value_type("luminance", ren::Visualize_Luminance),
    143 |     VisualizationMap::value_type("nobloom", ren::Visualize_NoBloom),     VisualizationMap::value_type("ssao", ren::Visualize_SSAO),
    144 |     VisualizationMap::value_type("vtc", ren::Visualize_VTCache),
    145 | };
```

### .\client\client_game.cpp:187
- Signature: L179: void SteamAPIDebugTextHook(int nSeverity, const char* pchDebugText)
```cpp
    167 | 
    168 | #ifdef HAVE_GOG
    169 | static const char* GOG_CLIENT_ID = "48364526722346195";
    170 | static const char* GOG_CLIENT_SECRET = "76f4e09131eab5265f21227cc8806f90a744fa50706697b8bd26ad488e3608d8";
    171 | #endif
    172 | 
    173 | extern bool sForceMipColor;
    174 | 
    175 | #ifdef HAVE_STEAM
    176 | 
    177 | namespace
    178 | {
    179 | void SteamAPIDebugTextHook(int nSeverity, const char* pchDebugText)
    180 | {
    181 |     ZU_Info << pchDebugText;
    182 | }
    183 | }  // namespace
    184 | 
    185 | #endif
    186 | 
>   187 | class BundleFileHandler : public CoherentUtilProtocol
    188 | {
    189 |     zu::RefNoCount<Filesystem> mFilesystem;
    190 |     TaskQueue* mQueue;
    191 |     ScopedChangeWatcher mBootWatcher;
    192 | 
    193 |     ContentBundler mBootJS, mBootCSS;
    194 |     std::function<void()> mReload;
    195 |     bool mNeedsReload;
    196 | 
    197 | public:
    198 |     BundleFileHandler(Platform* platform, std::string currentLocale)
    199 |         : CoherentUtilProtocol("bundle"),
    200 |           mFilesystem(platform->getFilesystem()),
    201 |           mQueue(platform->getUIThreadTaskQueue()),
    202 |           mBootJS(mFilesystem.get()),
    203 |           mBootCSS(mFilesystem.get()),
    204 |           mNeedsReload(true)
    205 |     {
    206 |         mReload = [this, currentLocale]() { createBootFiles(currentLocale); };
    207 |     }
```

### .\client\client_game.cpp:193
- Signature: L179: void SteamAPIDebugTextHook(int nSeverity, const char* pchDebugText)
```cpp
    173 | extern bool sForceMipColor;
    174 | 
    175 | #ifdef HAVE_STEAM
    176 | 
    177 | namespace
    178 | {
    179 | void SteamAPIDebugTextHook(int nSeverity, const char* pchDebugText)
    180 | {
    181 |     ZU_Info << pchDebugText;
    182 | }
    183 | }  // namespace
    184 | 
    185 | #endif
    186 | 
    187 | class BundleFileHandler : public CoherentUtilProtocol
    188 | {
    189 |     zu::RefNoCount<Filesystem> mFilesystem;
    190 |     TaskQueue* mQueue;
    191 |     ScopedChangeWatcher mBootWatcher;
    192 | 
>   193 |     ContentBundler mBootJS, mBootCSS;
    194 |     std::function<void()> mReload;
    195 |     bool mNeedsReload;
    196 | 
    197 | public:
    198 |     BundleFileHandler(Platform* platform, std::string currentLocale)
    199 |         : CoherentUtilProtocol("bundle"),
    200 |           mFilesystem(platform->getFilesystem()),
    201 |           mQueue(platform->getUIThreadTaskQueue()),
    202 |           mBootJS(mFilesystem.get()),
    203 |           mBootCSS(mFilesystem.get()),
    204 |           mNeedsReload(true)
    205 |     {
    206 |         mReload = [this, currentLocale]() { createBootFiles(currentLocale); };
    207 |     }
    208 | 
    209 |     void setLocale(std::string const& locale)
    210 |     {
    211 |         createBootFiles(locale);
    212 |     }
    213 | 
```

### .\client\client_game.cpp:198
- Signature: L179: void SteamAPIDebugTextHook(int nSeverity, const char* pchDebugText)
```cpp
    178 | {
    179 | void SteamAPIDebugTextHook(int nSeverity, const char* pchDebugText)
    180 | {
    181 |     ZU_Info << pchDebugText;
    182 | }
    183 | }  // namespace
    184 | 
    185 | #endif
    186 | 
    187 | class BundleFileHandler : public CoherentUtilProtocol
    188 | {
    189 |     zu::RefNoCount<Filesystem> mFilesystem;
    190 |     TaskQueue* mQueue;
    191 |     ScopedChangeWatcher mBootWatcher;
    192 | 
    193 |     ContentBundler mBootJS, mBootCSS;
    194 |     std::function<void()> mReload;
    195 |     bool mNeedsReload;
    196 | 
    197 | public:
>   198 |     BundleFileHandler(Platform* platform, std::string currentLocale)
    199 |         : CoherentUtilProtocol("bundle"),
    200 |           mFilesystem(platform->getFilesystem()),
    201 |           mQueue(platform->getUIThreadTaskQueue()),
    202 |           mBootJS(mFilesystem.get()),
    203 |           mBootCSS(mFilesystem.get()),
    204 |           mNeedsReload(true)
    205 |     {
    206 |         mReload = [this, currentLocale]() { createBootFiles(currentLocale); };
    207 |     }
    208 | 
    209 |     void setLocale(std::string const& locale)
    210 |     {
    211 |         createBootFiles(locale);
    212 |     }
    213 | 
    214 |     void reload()
    215 |     {
    216 |         mNeedsReload = true;
    217 |     }
    218 | 
```

### .\client\client_game.cpp:199
- Signature: L179: void SteamAPIDebugTextHook(int nSeverity, const char* pchDebugText)
```cpp
    179 | void SteamAPIDebugTextHook(int nSeverity, const char* pchDebugText)
    180 | {
    181 |     ZU_Info << pchDebugText;
    182 | }
    183 | }  // namespace
    184 | 
    185 | #endif
    186 | 
    187 | class BundleFileHandler : public CoherentUtilProtocol
    188 | {
    189 |     zu::RefNoCount<Filesystem> mFilesystem;
    190 |     TaskQueue* mQueue;
    191 |     ScopedChangeWatcher mBootWatcher;
    192 | 
    193 |     ContentBundler mBootJS, mBootCSS;
    194 |     std::function<void()> mReload;
    195 |     bool mNeedsReload;
    196 | 
    197 | public:
    198 |     BundleFileHandler(Platform* platform, std::string currentLocale)
>   199 |         : CoherentUtilProtocol("bundle"),
    200 |           mFilesystem(platform->getFilesystem()),
    201 |           mQueue(platform->getUIThreadTaskQueue()),
    202 |           mBootJS(mFilesystem.get()),
    203 |           mBootCSS(mFilesystem.get()),
    204 |           mNeedsReload(true)
    205 |     {
    206 |         mReload = [this, currentLocale]() { createBootFiles(currentLocale); };
    207 |     }
    208 | 
    209 |     void setLocale(std::string const& locale)
    210 |     {
    211 |         createBootFiles(locale);
    212 |     }
    213 | 
    214 |     void reload()
    215 |     {
    216 |         mNeedsReload = true;
    217 |     }
    218 | 
    219 |     bool ReadFileIfModifiedSince(std::string const& url, std::string eTagHeader, time_t ifModifiedSince, Coherent::UI::URLRequestBase* request,
```

### .\client\client_game.cpp:228
- Signature: L214:     void reload()
```cpp
    208 | 
    209 |     void setLocale(std::string const& locale)
    210 |     {
    211 |         createBootFiles(locale);
    212 |     }
    213 | 
    214 |     void reload()
    215 |     {
    216 |         mNeedsReload = true;
    217 |     }
    218 | 
    219 |     bool ReadFileIfModifiedSince(std::string const& url, std::string eTagHeader, time_t ifModifiedSince, Coherent::UI::URLRequestBase* request,
    220 |                                  Coherent::UI::ResourceResponse* response) override
    221 |     {
    222 |         std::string scheme = Uri(url).scheme.toString() + "://";
    223 |         std::string relative = url.substr(scheme.length());
    224 | 
    225 |         // This assumes we're on the correct queue (mQueue) when ReadFileIfModifiedSince is called. That is the case since we poll Coherent from the main thread.
    226 |         if (mNeedsReload) mReload();
    227 | 
>   228 |         ContentBundler* bundle = nullptr;
    229 |         if (relative == "boot/boot.js")
    230 |             bundle = &mBootJS;
    231 |         else if (relative == "boot/boot.css")
    232 |             bundle = &mBootCSS;
    233 | 
    234 |         if (bundle == nullptr)
    235 |         {
    236 |             respondWithNotFound(response);
    237 |             return true;
    238 |         }
    239 | 
    240 |         if (handleIfModifiedSince(response, eTagHeader, bundle->md5(), ifModifiedSince, bundle->lastModified(), false)) return false;
    241 | 
    242 |         respondWithData(response, bundle->data());
    243 |         return true;
    244 |     }
    245 | 
    246 | private:
    247 |     void createBootFiles(std::string currentLocale)
    248 |     {
```

### .\client\client_game.cpp:230
- Signature: L214:     void reload()
```cpp
    210 |     {
    211 |         createBootFiles(locale);
    212 |     }
    213 | 
    214 |     void reload()
    215 |     {
    216 |         mNeedsReload = true;
    217 |     }
    218 | 
    219 |     bool ReadFileIfModifiedSince(std::string const& url, std::string eTagHeader, time_t ifModifiedSince, Coherent::UI::URLRequestBase* request,
    220 |                                  Coherent::UI::ResourceResponse* response) override
    221 |     {
    222 |         std::string scheme = Uri(url).scheme.toString() + "://";
    223 |         std::string relative = url.substr(scheme.length());
    224 | 
    225 |         // This assumes we're on the correct queue (mQueue) when ReadFileIfModifiedSince is called. That is the case since we poll Coherent from the main thread.
    226 |         if (mNeedsReload) mReload();
    227 | 
    228 |         ContentBundler* bundle = nullptr;
    229 |         if (relative == "boot/boot.js")
>   230 |             bundle = &mBootJS;
    231 |         else if (relative == "boot/boot.css")
    232 |             bundle = &mBootCSS;
    233 | 
    234 |         if (bundle == nullptr)
    235 |         {
    236 |             respondWithNotFound(response);
    237 |             return true;
    238 |         }
    239 | 
    240 |         if (handleIfModifiedSince(response, eTagHeader, bundle->md5(), ifModifiedSince, bundle->lastModified(), false)) return false;
    241 | 
    242 |         respondWithData(response, bundle->data());
    243 |         return true;
    244 |     }
    245 | 
    246 | private:
    247 |     void createBootFiles(std::string currentLocale)
    248 |     {
    249 |         mReload = [this, currentLocale]() { createBootFiles(currentLocale); };
    250 |         mBootWatcher.reset([this] { mNeedsReload = true; }, mQueue);
```

### .\client\client_game.cpp:232
- Signature: L231:         else if (relative == "boot/boot.css")
```cpp
    212 |     }
    213 | 
    214 |     void reload()
    215 |     {
    216 |         mNeedsReload = true;
    217 |     }
    218 | 
    219 |     bool ReadFileIfModifiedSince(std::string const& url, std::string eTagHeader, time_t ifModifiedSince, Coherent::UI::URLRequestBase* request,
    220 |                                  Coherent::UI::ResourceResponse* response) override
    221 |     {
    222 |         std::string scheme = Uri(url).scheme.toString() + "://";
    223 |         std::string relative = url.substr(scheme.length());
    224 | 
    225 |         // This assumes we're on the correct queue (mQueue) when ReadFileIfModifiedSince is called. That is the case since we poll Coherent from the main thread.
    226 |         if (mNeedsReload) mReload();
    227 | 
    228 |         ContentBundler* bundle = nullptr;
    229 |         if (relative == "boot/boot.js")
    230 |             bundle = &mBootJS;
    231 |         else if (relative == "boot/boot.css")
>   232 |             bundle = &mBootCSS;
    233 | 
    234 |         if (bundle == nullptr)
    235 |         {
    236 |             respondWithNotFound(response);
    237 |             return true;
    238 |         }
    239 | 
    240 |         if (handleIfModifiedSince(response, eTagHeader, bundle->md5(), ifModifiedSince, bundle->lastModified(), false)) return false;
    241 | 
    242 |         respondWithData(response, bundle->data());
    243 |         return true;
    244 |     }
    245 | 
    246 | private:
    247 |     void createBootFiles(std::string currentLocale)
    248 |     {
    249 |         mReload = [this, currentLocale]() { createBootFiles(currentLocale); };
    250 |         mBootWatcher.reset([this] { mNeedsReload = true; }, mQueue);
    251 | 
    252 |         ZU_Info << "Caching boot.js & boot.css";
```

### .\client\client_game.cpp:234
- Signature: L231:         else if (relative == "boot/boot.css")
```cpp
    214 |     void reload()
    215 |     {
    216 |         mNeedsReload = true;
    217 |     }
    218 | 
    219 |     bool ReadFileIfModifiedSince(std::string const& url, std::string eTagHeader, time_t ifModifiedSince, Coherent::UI::URLRequestBase* request,
    220 |                                  Coherent::UI::ResourceResponse* response) override
    221 |     {
    222 |         std::string scheme = Uri(url).scheme.toString() + "://";
    223 |         std::string relative = url.substr(scheme.length());
    224 | 
    225 |         // This assumes we're on the correct queue (mQueue) when ReadFileIfModifiedSince is called. That is the case since we poll Coherent from the main thread.
    226 |         if (mNeedsReload) mReload();
    227 | 
    228 |         ContentBundler* bundle = nullptr;
    229 |         if (relative == "boot/boot.js")
    230 |             bundle = &mBootJS;
    231 |         else if (relative == "boot/boot.css")
    232 |             bundle = &mBootCSS;
    233 | 
>   234 |         if (bundle == nullptr)
    235 |         {
    236 |             respondWithNotFound(response);
    237 |             return true;
    238 |         }
    239 | 
    240 |         if (handleIfModifiedSince(response, eTagHeader, bundle->md5(), ifModifiedSince, bundle->lastModified(), false)) return false;
    241 | 
    242 |         respondWithData(response, bundle->data());
    243 |         return true;
    244 |     }
    245 | 
    246 | private:
    247 |     void createBootFiles(std::string currentLocale)
    248 |     {
    249 |         mReload = [this, currentLocale]() { createBootFiles(currentLocale); };
    250 |         mBootWatcher.reset([this] { mNeedsReload = true; }, mQueue);
    251 | 
    252 |         ZU_Info << "Caching boot.js & boot.css";
    253 | 
    254 |         auto path = mFilesystem->getSystemPath("/ui/boot.json", mBootWatcher);
```

### .\client\client_game.cpp:240
- Signature: L231:         else if (relative == "boot/boot.css")
```cpp
    220 |                                  Coherent::UI::ResourceResponse* response) override
    221 |     {
    222 |         std::string scheme = Uri(url).scheme.toString() + "://";
    223 |         std::string relative = url.substr(scheme.length());
    224 | 
    225 |         // This assumes we're on the correct queue (mQueue) when ReadFileIfModifiedSince is called. That is the case since we poll Coherent from the main thread.
    226 |         if (mNeedsReload) mReload();
    227 | 
    228 |         ContentBundler* bundle = nullptr;
    229 |         if (relative == "boot/boot.js")
    230 |             bundle = &mBootJS;
    231 |         else if (relative == "boot/boot.css")
    232 |             bundle = &mBootCSS;
    233 | 
    234 |         if (bundle == nullptr)
    235 |         {
    236 |             respondWithNotFound(response);
    237 |             return true;
    238 |         }
    239 | 
>   240 |         if (handleIfModifiedSince(response, eTagHeader, bundle->md5(), ifModifiedSince, bundle->lastModified(), false)) return false;
    241 | 
    242 |         respondWithData(response, bundle->data());
    243 |         return true;
    244 |     }
    245 | 
    246 | private:
    247 |     void createBootFiles(std::string currentLocale)
    248 |     {
    249 |         mReload = [this, currentLocale]() { createBootFiles(currentLocale); };
    250 |         mBootWatcher.reset([this] { mNeedsReload = true; }, mQueue);
    251 | 
    252 |         ZU_Info << "Caching boot.js & boot.css";
    253 | 
    254 |         auto path = mFilesystem->getSystemPath("/ui/boot.json", mBootWatcher);
    255 | 
    256 |         time_t lastModified = zu::osutil::fileLastModified(path.c_str());
    257 | 
    258 |         mBootCSS.reset(lastModified);
    259 |         mBootJS.reset(lastModified);
    260 | 
```

### .\client\client_game.cpp:242
- Signature: L231:         else if (relative == "boot/boot.css")
```cpp
    222 |         std::string scheme = Uri(url).scheme.toString() + "://";
    223 |         std::string relative = url.substr(scheme.length());
    224 | 
    225 |         // This assumes we're on the correct queue (mQueue) when ReadFileIfModifiedSince is called. That is the case since we poll Coherent from the main thread.
    226 |         if (mNeedsReload) mReload();
    227 | 
    228 |         ContentBundler* bundle = nullptr;
    229 |         if (relative == "boot/boot.js")
    230 |             bundle = &mBootJS;
    231 |         else if (relative == "boot/boot.css")
    232 |             bundle = &mBootCSS;
    233 | 
    234 |         if (bundle == nullptr)
    235 |         {
    236 |             respondWithNotFound(response);
    237 |             return true;
    238 |         }
    239 | 
    240 |         if (handleIfModifiedSince(response, eTagHeader, bundle->md5(), ifModifiedSince, bundle->lastModified(), false)) return false;
    241 | 
>   242 |         respondWithData(response, bundle->data());
    243 |         return true;
    244 |     }
    245 | 
    246 | private:
    247 |     void createBootFiles(std::string currentLocale)
    248 |     {
    249 |         mReload = [this, currentLocale]() { createBootFiles(currentLocale); };
    250 |         mBootWatcher.reset([this] { mNeedsReload = true; }, mQueue);
    251 | 
    252 |         ZU_Info << "Caching boot.js & boot.css";
    253 | 
    254 |         auto path = mFilesystem->getSystemPath("/ui/boot.json", mBootWatcher);
    255 | 
    256 |         time_t lastModified = zu::osutil::fileLastModified(path.c_str());
    257 | 
    258 |         mBootCSS.reset(lastModified);
    259 |         mBootJS.reset(lastModified);
    260 | 
    261 |         auto file = mFilesystem->open("/ui/boot.json", mBootWatcher);
    262 |         if (file == nullptr) throw std::runtime_error("Unable to open /ui/boot.json");
```

### .\client\client_game.cpp:707
- Signature: L635: static Json loadBootConfig(std::string const& path)
```cpp
    687 |       mSource(ZU_PA_TIME_SEED),
    688 |       mResolutionScaling(1.0f),
    689 |       mJSEngineParams(Json::makeObject())
    690 | #ifdef HAVE_STEAM
    691 |       ,
    692 |       mCallbackMicroTxnAuthorization(this, &ClientGame::OnMicroTxnAuthorization)
    693 | #endif
    694 |       ,
    695 |       mActiveUberNetCalls(0),
    696 |       mMatchmakingManager(*this, mSource),
    697 |       mSupportedContent(determineSupportedContent(mConfirmedSteam)),
    698 |       mMountedContent("NONE"),
    699 |       mBootConfig(loadBootConfig(getBootConfigPath())),
    700 |       mSteamOverlayDisplayed(false)
    701 | #ifdef HAVE_STEAM
    702 |       ,
    703 |       mCallbackGameOverlayActivated(this, &ClientGame::OnGameOverlayActivated)
    704 | #endif
    705 |       ,
    706 |       mDownloadManager(new DownloadManager(this)),
>   707 |       mCompressServerMods(true),
    708 |       mContextReady(false),
    709 |       mOffline(cmdline_offline.isSet()),
    710 |       mDefaultSkyBoxSpec("/pa/terrain/sky/textures/skybox_01.json")
    711 | {
    712 |     // mikeyh load version, open logs and setup breakpad as early as possible
    713 | 
    714 |     {
    715 | #if defined(_DEBUG)
    716 |         if (cmdline_version.isSet())
    717 |             mVersion = cmdline_version.toString();
    718 |         else
    719 | #endif
    720 |         {
    721 |             #if !defined(BUILD_CHANGELIST)
    722 |             #   error "BUILD_CHANGELIST must be defined"
    723 |             #endif
    724 |             mVersion = std::to_string(BUILD_CHANGELIST);
    725 |         }
    726 | 
    727 |         /* build.txt will have te CL number of thebuild when built from a Jenkins job eg: 115958 */
```

### .\client\client_game.cpp:1450
- Signature: L1419: void ClientGame::resetGameStateInternal(std::string const& content)
```cpp
   1430 | 
   1431 |     clearHolodecks();
   1432 |     clearClientViews();
   1433 | 
   1434 |     resetInterface();
   1435 | 
   1436 |     mSimAvailable = false;
   1437 | 
   1438 |     mStatsViewpoint.reset();
   1439 |     mConnectionToServer.reset();
   1440 | 
   1441 |     mEnv->planet_builders.clear();
   1442 |     mEnv->planet_textures.clear();
   1443 |     mEnv->game_config.reset();
   1444 | 
   1445 |     setupViewportStack();
   1446 | 
   1447 |     mServerMountedRemoteModCollection.reset();
   1448 |     mountContent(content);
   1449 | 
>  1450 |     mCompressServerMods = true;
   1451 | }
   1452 | 
   1453 | void ClientGame::resetGameState() /* exposed to ui */
   1454 | {
   1455 |     resetGameStateInternal(getActiveContent());
   1456 | }
   1457 | 
   1458 | void ClientGame::setup()
   1459 | {
   1460 |     HProfiler_FnZone();
   1461 | 
   1462 |     renderer()->setHorizonOcclusion(cmdline_horizonOcclusion.isSet());
   1463 | 
   1464 |     auto fs = platform()->getFilesystem();
   1465 | 
   1466 |     {
   1467 |         std::string cacerts(fs->getSystemPath("/nomod/cacert.pem", nullptr));
   1468 | #if HAVE_POLL_THREAD
   1469 |         mHttpLoader.reset(net::createPollCurlHttpLoader(platform()->getPollThread(), std::move(cacerts)));
   1470 | #elif defined(PLATFORM_WINDOWS)
```

### .\client\client_game.cpp:1502
- Signature: L1458: void ClientGame::setup()
```cpp
   1482 |         if (!cmdline_mods_url.value().endsWith("/")) mModsURL = mModsURL + "/";
   1483 |     }
   1484 | 
   1485 |     mSettingsDB.reset(new crom::SettingsDB(fs, loaderTaskQueue()));
   1486 | 
   1487 |     registerConsoleCommands();
   1488 |     mConsoleLogSink.reset(new ClientGame::LogSinkConsole(*this));
   1489 | 
   1490 |     // Don't prepend our backlog to new logsinks after this. We now both have it in the console and the log file.
   1491 |     LogSink::setBacklog(0);
   1492 | 
   1493 |     mPapaFormat.reset(resourceSystem(), ".papa", new PapaResourceFormat(false));
   1494 |     mPngFormat.reset(resourceSystem(), ".png", new PngFormat(renderer()->getTextureFactory(), mSettingsDB.get()));
   1495 | 
   1496 |     platform()->getWindowSize(mWindowWidth, mWindowHeight);
   1497 | 
   1498 |     try
   1499 |     {
   1500 |         HProfiler_FnSubZone("Initialize Coherent");
   1501 | 
>  1502 |         BundleFileHandler* bundleHandler = new BundleFileHandler(platform(), locGetCurrentLocale());
   1503 |         SpecFileHandler* specHandler = new SpecFileHandler(platform()->getUIThreadTaskQueue(), loaderTaskQueue());
   1504 |         std::unique_ptr<CoherentUtilProtocol> atlasHandler(createSynchronousFileHandler("atlas", fs, "/ui/main/atlas", false));
   1505 | 
   1506 |         // mikeyh uncached now forces a cache breaker header for chromium while still using memmory cache
   1507 |         std::unique_ptr<CoherentUtilProtocol> uncachedHandler(createSynchronousFileHandler("uncached", fs, "", true));
   1508 | 
   1509 |         int debuggerPort = -1;
   1510 |         if (cmdline_coherent_port.isSet()) zu::parse_int(cmdline_coherent_port.value(), debuggerPort);
   1511 | 
   1512 |         int gtDebuggerPort = 9998;
   1513 |         if (cmdline_coherent_gt_port.isSet()) zu::parse_int(cmdline_coherent_gt_port.value(), gtDebuggerPort);
   1514 | 
   1515 |         std::string localstore = cmdline_localstorageurl.isSet() ? cmdline_localstorageurl.value().toString() : "localstore";
   1516 | 
   1517 |         std::string localstorage = path::join(platform()->getUserDataDir(), localstore);
   1518 | 
   1519 |         if (platform()->checkMultipleInstances("planetary-annihilation-" + localstore)) platform()->fatalError("Another copy of PA using the same localstore is already running");
   1520 | 
   1521 |         std::vector<CoherentUtilProtocol*> customProtocols;
   1522 |         customProtocols.push_back(bundleHandler);
```

### .\client\client_game.cpp:1522
- Signature: L1458: void ClientGame::setup()
```cpp
   1502 |         BundleFileHandler* bundleHandler = new BundleFileHandler(platform(), locGetCurrentLocale());
   1503 |         SpecFileHandler* specHandler = new SpecFileHandler(platform()->getUIThreadTaskQueue(), loaderTaskQueue());
   1504 |         std::unique_ptr<CoherentUtilProtocol> atlasHandler(createSynchronousFileHandler("atlas", fs, "/ui/main/atlas", false));
   1505 | 
   1506 |         // mikeyh uncached now forces a cache breaker header for chromium while still using memmory cache
   1507 |         std::unique_ptr<CoherentUtilProtocol> uncachedHandler(createSynchronousFileHandler("uncached", fs, "", true));
   1508 | 
   1509 |         int debuggerPort = -1;
   1510 |         if (cmdline_coherent_port.isSet()) zu::parse_int(cmdline_coherent_port.value(), debuggerPort);
   1511 | 
   1512 |         int gtDebuggerPort = 9998;
   1513 |         if (cmdline_coherent_gt_port.isSet()) zu::parse_int(cmdline_coherent_gt_port.value(), gtDebuggerPort);
   1514 | 
   1515 |         std::string localstore = cmdline_localstorageurl.isSet() ? cmdline_localstorageurl.value().toString() : "localstore";
   1516 | 
   1517 |         std::string localstorage = path::join(platform()->getUserDataDir(), localstore);
   1518 | 
   1519 |         if (platform()->checkMultipleInstances("planetary-annihilation-" + localstore)) platform()->fatalError("Another copy of PA using the same localstore is already running");
   1520 | 
   1521 |         std::vector<CoherentUtilProtocol*> customProtocols;
>  1522 |         customProtocols.push_back(bundleHandler);
   1523 |         customProtocols.push_back(specHandler);
   1524 |         customProtocols.push_back(atlasHandler.get());
   1525 |         customProtocols.push_back(uncachedHandler.get());
   1526 | 
   1527 |         mCoherent.reset(new CoherentUI(path::join(getExecutableDir(), "host"), localstorage, this, platform(), customProtocols, cmdline_softwareui.isSet(), debuggerPort
   1528 |                                        //                                       , gtDebuggerPort
   1529 |                                        ));
   1530 | 
   1531 |         mBundleHandler.reset(bundleHandler);
   1532 |         mSpecHandler.reset(specHandler);
   1533 |         mAtlasHandler = std::move(atlasHandler);
   1534 |         mUncachedHandler = std::move(uncachedHandler);
   1535 |     }
   1536 |     catch (std::exception& e)
   1537 |     {
   1538 |         breakpadutil::uploadCurrentStack("Coherent Init Failed");
   1539 |         ZU_Error << "Caught exception when constructing CoherentUI - " << e.what();
   1540 |         platform()->fatalError(CoherentErrors::InitFailed);
   1541 |     }
   1542 | 
```

### .\client\client_game.cpp:1531
- Signature: L1458: void ClientGame::setup()
```cpp
   1511 | 
   1512 |         int gtDebuggerPort = 9998;
   1513 |         if (cmdline_coherent_gt_port.isSet()) zu::parse_int(cmdline_coherent_gt_port.value(), gtDebuggerPort);
   1514 | 
   1515 |         std::string localstore = cmdline_localstorageurl.isSet() ? cmdline_localstorageurl.value().toString() : "localstore";
   1516 | 
   1517 |         std::string localstorage = path::join(platform()->getUserDataDir(), localstore);
   1518 | 
   1519 |         if (platform()->checkMultipleInstances("planetary-annihilation-" + localstore)) platform()->fatalError("Another copy of PA using the same localstore is already running");
   1520 | 
   1521 |         std::vector<CoherentUtilProtocol*> customProtocols;
   1522 |         customProtocols.push_back(bundleHandler);
   1523 |         customProtocols.push_back(specHandler);
   1524 |         customProtocols.push_back(atlasHandler.get());
   1525 |         customProtocols.push_back(uncachedHandler.get());
   1526 | 
   1527 |         mCoherent.reset(new CoherentUI(path::join(getExecutableDir(), "host"), localstorage, this, platform(), customProtocols, cmdline_softwareui.isSet(), debuggerPort
   1528 |                                        //                                       , gtDebuggerPort
   1529 |                                        ));
   1530 | 
>  1531 |         mBundleHandler.reset(bundleHandler);
   1532 |         mSpecHandler.reset(specHandler);
   1533 |         mAtlasHandler = std::move(atlasHandler);
   1534 |         mUncachedHandler = std::move(uncachedHandler);
   1535 |     }
   1536 |     catch (std::exception& e)
   1537 |     {
   1538 |         breakpadutil::uploadCurrentStack("Coherent Init Failed");
   1539 |         ZU_Error << "Caught exception when constructing CoherentUI - " << e.what();
   1540 |         platform()->fatalError(CoherentErrors::InitFailed);
   1541 |     }
   1542 | 
   1543 |     mUIBridge.reset(new UIBridge(this, mCoherent.get(), platform()->getUIThreadTaskQueue()));
   1544 |     mEnv->ui_bridge = mUIBridge.get();
   1545 | 
   1546 |     setupViewportStack();
   1547 | 
   1548 |     crom::TexturePool* tp = new TexturePool(resourceSystem(), renderer()->getTextureFactory(), loaderTaskQueue());
   1549 | 
   1550 |     mEnv->game_textures.reset(tp);
   1551 |     mEnv->icon_atlas = &mIconAtlas;
```

### .\client\client_game.cpp:3472
- Signature: L3468: void ClientGame::connection_LoginAccepted(std::string version, std::string buildid, size_t replayVersion)
```cpp
   3452 |     std::stringstream s;
   3453 |     s << net::DottedDecimal(ipaddr);
   3454 |     data.set("host", Json::makeString(s.str()));
   3455 |     data.set("message_type", Json::makeString("lost_beacon"));
   3456 |     mUIBridge->sendUIMessage(data, UIBridge::MessageDelivery::Reliable);
   3457 | }
   3458 | 
   3459 | void ClientGame::connection_ConnectionFailed()
   3460 | {
   3461 |     HProfiler_FnZone();
   3462 | 
   3463 |     breakpadutil::setUploadParam("Lobby", "");
   3464 | 
   3465 |     ZU_Info << __FUNCTION__;
   3466 |     mUIBridge->sendUISignal("connection_failed", UIBridge::MessageDelivery::Reliable);
   3467 | }
   3468 | void ClientGame::connection_LoginAccepted(std::string version, std::string buildid, size_t replayVersion)
   3469 | {
   3470 |     HProfiler_FnZone();
   3471 | 
>  3472 |     if (replayVersion < LZ4_REPLAY_VERSION)
   3473 |     {
   3474 |         mCompressServerMods = false;
   3475 |     }
   3476 | 
   3477 |     ZU_Info << __FUNCTION__;
   3478 |     mUIBridge->sendUISignal("login_accepted", UIBridge::MessageDelivery::Reliable);
   3479 | }
   3480 | void ClientGame::connection_LoginRejected()
   3481 | {
   3482 |     HProfiler_FnZone();
   3483 | 
   3484 |     breakpadutil::setUploadParam("Lobby", "");
   3485 | 
   3486 |     ZU_Info << __FUNCTION__;
   3487 |     mUIBridge->sendUISignal("login_rejected", UIBridge::MessageDelivery::Reliable);
   3488 | }
   3489 | void ClientGame::connection_Message(zu::Json const& json)
   3490 | {
   3491 |     HProfiler_FnZone();
   3492 |     mUIBridge->sendUIMessage(json, UIBridge::MessageDelivery::Reliable);
```

### .\client\client_game.cpp:3474
- Signature: L3468: void ClientGame::connection_LoginAccepted(std::string version, std::string buildid, size_t replayVersion)
```cpp
   3454 |     data.set("host", Json::makeString(s.str()));
   3455 |     data.set("message_type", Json::makeString("lost_beacon"));
   3456 |     mUIBridge->sendUIMessage(data, UIBridge::MessageDelivery::Reliable);
   3457 | }
   3458 | 
   3459 | void ClientGame::connection_ConnectionFailed()
   3460 | {
   3461 |     HProfiler_FnZone();
   3462 | 
   3463 |     breakpadutil::setUploadParam("Lobby", "");
   3464 | 
   3465 |     ZU_Info << __FUNCTION__;
   3466 |     mUIBridge->sendUISignal("connection_failed", UIBridge::MessageDelivery::Reliable);
   3467 | }
   3468 | void ClientGame::connection_LoginAccepted(std::string version, std::string buildid, size_t replayVersion)
   3469 | {
   3470 |     HProfiler_FnZone();
   3471 | 
   3472 |     if (replayVersion < LZ4_REPLAY_VERSION)
   3473 |     {
>  3474 |         mCompressServerMods = false;
   3475 |     }
   3476 | 
   3477 |     ZU_Info << __FUNCTION__;
   3478 |     mUIBridge->sendUISignal("login_accepted", UIBridge::MessageDelivery::Reliable);
   3479 | }
   3480 | void ClientGame::connection_LoginRejected()
   3481 | {
   3482 |     HProfiler_FnZone();
   3483 | 
   3484 |     breakpadutil::setUploadParam("Lobby", "");
   3485 | 
   3486 |     ZU_Info << __FUNCTION__;
   3487 |     mUIBridge->sendUISignal("login_rejected", UIBridge::MessageDelivery::Reliable);
   3488 | }
   3489 | void ClientGame::connection_Message(zu::Json const& json)
   3490 | {
   3491 |     HProfiler_FnZone();
   3492 |     mUIBridge->sendUIMessage(json, UIBridge::MessageDelivery::Reliable);
   3493 | 
   3494 |     if (!clientInterface())
```

### .\client\client_game.cpp:3543
- Signature: L3543: void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
```cpp
   3523 | }
   3524 | 
   3525 | float ClientGame::scale() const
   3526 | {
   3527 |     if (mStatMode == 2)
   3528 |         return 1;
   3529 |     else if (mConnectionToServer)
   3530 |     {
   3531 |         if (mStatMode == 3)
   3532 |             return mConnectionToServer->serverScale();
   3533 |         else if (mStatMode == 4)
   3534 |             return mConnectionToServer->simScale();
   3535 |     }
   3536 |     return platform()->getProfiler().scale();
   3537 | }
   3538 | 
   3539 | void ClientGame::connection_ProfilerStatsUpdated()
   3540 | {
   3541 | }
   3542 | 
>  3543 | void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
   3544 | {
   3545 |     auto modCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle, "server");
   3546 |     if (modCollection != nullptr)
   3547 |     {
   3548 |         mServerLoadedRemoteModCollection = modCollection;
   3549 | 
   3550 |         // we mount as soon as we download the bundle (since the bundle is coming from the server so it's expecting us to use it)
   3551 |         mountServerMods();
   3552 | 
   3553 |         // mounting mods resets the spec lib if we're using one, but that reset may be queued up and we don't want to
   3554 |         //   send our response message until after this has occurred.
   3555 | 
   3556 |         platform()->getUIThreadTaskQueue()->enqueue(
   3557 |             [=]()
   3558 |             {
   3559 |                 Json data(Json::makeObject());
   3560 |                 data.set("message_type", Json::makeString("mod_data_received"));
   3561 |                 Json payload(Json::makeObject());
   3562 |                 // payload.set("auth_token", Json::makeString(auth_token));
   3563 |                 data.set("payload", payload);
```

### .\client\client_game.cpp:3545
- Signature: L3543: void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
```cpp
   3525 | float ClientGame::scale() const
   3526 | {
   3527 |     if (mStatMode == 2)
   3528 |         return 1;
   3529 |     else if (mConnectionToServer)
   3530 |     {
   3531 |         if (mStatMode == 3)
   3532 |             return mConnectionToServer->serverScale();
   3533 |         else if (mStatMode == 4)
   3534 |             return mConnectionToServer->simScale();
   3535 |     }
   3536 |     return platform()->getProfiler().scale();
   3537 | }
   3538 | 
   3539 | void ClientGame::connection_ProfilerStatsUpdated()
   3540 | {
   3541 | }
   3542 | 
   3543 | void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
   3544 | {
>  3545 |     auto modCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle, "server");
   3546 |     if (modCollection != nullptr)
   3547 |     {
   3548 |         mServerLoadedRemoteModCollection = modCollection;
   3549 | 
   3550 |         // we mount as soon as we download the bundle (since the bundle is coming from the server so it's expecting us to use it)
   3551 |         mountServerMods();
   3552 | 
   3553 |         // mounting mods resets the spec lib if we're using one, but that reset may be queued up and we don't want to
   3554 |         //   send our response message until after this has occurred.
   3555 | 
   3556 |         platform()->getUIThreadTaskQueue()->enqueue(
   3557 |             [=]()
   3558 |             {
   3559 |                 Json data(Json::makeObject());
   3560 |                 data.set("message_type", Json::makeString("mod_data_received"));
   3561 |                 Json payload(Json::makeObject());
   3562 |                 // payload.set("auth_token", Json::makeString(auth_token));
   3563 |                 data.set("payload", payload);
   3564 | 
   3565 |                 connSendMessage(data.asString());
```

### .\client\client_game.cpp:3550
- Signature: L3543: void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
```cpp
   3530 |     {
   3531 |         if (mStatMode == 3)
   3532 |             return mConnectionToServer->serverScale();
   3533 |         else if (mStatMode == 4)
   3534 |             return mConnectionToServer->simScale();
   3535 |     }
   3536 |     return platform()->getProfiler().scale();
   3537 | }
   3538 | 
   3539 | void ClientGame::connection_ProfilerStatsUpdated()
   3540 | {
   3541 | }
   3542 | 
   3543 | void ClientGame::connection_DownloadModFileData(ModFileDataPackageBundle const& bundle)
   3544 | {
   3545 |     auto modCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle, "server");
   3546 |     if (modCollection != nullptr)
   3547 |     {
   3548 |         mServerLoadedRemoteModCollection = modCollection;
   3549 | 
>  3550 |         // we mount as soon as we download the bundle (since the bundle is coming from the server so it's expecting us to use it)
   3551 |         mountServerMods();
   3552 | 
   3553 |         // mounting mods resets the spec lib if we're using one, but that reset may be queued up and we don't want to
   3554 |         //   send our response message until after this has occurred.
   3555 | 
   3556 |         platform()->getUIThreadTaskQueue()->enqueue(
   3557 |             [=]()
   3558 |             {
   3559 |                 Json data(Json::makeObject());
   3560 |                 data.set("message_type", Json::makeString("mod_data_received"));
   3561 |                 Json payload(Json::makeObject());
   3562 |                 // payload.set("auth_token", Json::makeString(auth_token));
   3563 |                 data.set("payload", payload);
   3564 | 
   3565 |                 connSendMessage(data.asString());
   3566 |             });
   3567 |     }
   3568 | }
   3569 | 
   3570 | void ClientGame::connection_GameConfig(GameConfig const& config)
```

### .\client\client_game.cpp:5890
- Signature: L5869: void ClientGame::modsSendModFileDataToServer(std::string const& auth_token)
```cpp
   5870 | {
   5871 |     // if the incoming auth token is blank, we'll use the one we already have
   5872 |     if (!auth_token.empty())
   5873 |     {
   5874 |         mModUpdateAuthToken = auth_token;
   5875 |     }
   5876 |     if (mModUpdateAuthToken.empty())
   5877 |     {
   5878 |         ZU_Error << "modsSendModFileDataToServer: Unable to send mod file data (No auth token)";
   5879 |         return;
   5880 |     }
   5881 | 
   5882 |     if (!mConnectionToServer)
   5883 |     {
   5884 |         ZU_Error << "modsSendModFileDataToServer: Unable to send mod file data (No connection)";
   5885 |         return;
   5886 |     }
   5887 | 
   5888 |     if (mServerLoadedRemoteModCollection != nullptr)
   5889 |     {
>  5890 |         ModFileDataPackageBundleAuthorized bundle_auth(mModUpdateAuthToken, mServerLoadedRemoteModCollection->getDataPackageBundle());
   5891 | 
   5892 |         mConnectionToServer->sendModFileData(bundle_auth, mServerLoadedRemoteModCollection->getEstimatedSize());
   5893 |     }
   5894 | }
   5895 | 
   5896 | void ClientGame::modsMountModFileData()
   5897 | {
   5898 |     mountServerMods();
   5899 | }
   5900 | 
   5901 | 
   5902 | void ClientGame::mountServerMods()
   5903 | {
   5904 |     auto mfs = platform()->getFilesystem()->isMemoryFilesystem();
   5905 |     if (mfs)
   5906 |     {
   5907 |         if (mServerMountedRemoteModCollection)
   5908 |         {
   5909 |             mServerMountedRemoteModCollection->unmount();
   5910 | 
```

### .\client\client_game.cpp:5892
- Signature: L5869: void ClientGame::modsSendModFileDataToServer(std::string const& auth_token)
```cpp
   5872 |     if (!auth_token.empty())
   5873 |     {
   5874 |         mModUpdateAuthToken = auth_token;
   5875 |     }
   5876 |     if (mModUpdateAuthToken.empty())
   5877 |     {
   5878 |         ZU_Error << "modsSendModFileDataToServer: Unable to send mod file data (No auth token)";
   5879 |         return;
   5880 |     }
   5881 | 
   5882 |     if (!mConnectionToServer)
   5883 |     {
   5884 |         ZU_Error << "modsSendModFileDataToServer: Unable to send mod file data (No connection)";
   5885 |         return;
   5886 |     }
   5887 | 
   5888 |     if (mServerLoadedRemoteModCollection != nullptr)
   5889 |     {
   5890 |         ModFileDataPackageBundleAuthorized bundle_auth(mModUpdateAuthToken, mServerLoadedRemoteModCollection->getDataPackageBundle());
   5891 | 
>  5892 |         mConnectionToServer->sendModFileData(bundle_auth, mServerLoadedRemoteModCollection->getEstimatedSize());
   5893 |     }
   5894 | }
   5895 | 
   5896 | void ClientGame::modsMountModFileData()
   5897 | {
   5898 |     mountServerMods();
   5899 | }
   5900 | 
   5901 | 
   5902 | void ClientGame::mountServerMods()
   5903 | {
   5904 |     auto mfs = platform()->getFilesystem()->isMemoryFilesystem();
   5905 |     if (mfs)
   5906 |     {
   5907 |         if (mServerMountedRemoteModCollection)
   5908 |         {
   5909 |             mServerMountedRemoteModCollection->unmount();
   5910 | 
   5911 |             // Re-mount zips.
   5912 |             for (auto&& zipMount : mMountedZips) mfs->mountZipFile(zipMount.first, zipMount.second);
```

### .\client\client_game.cpp:5933
- Signature: L5929: void ClientGame::serverModsUpdated()
```cpp
   5913 |         }
   5914 | 
   5915 |         mServerMountedRemoteModCollection = mServerLoadedRemoteModCollection ? mServerLoadedRemoteModCollection->mountToMemoryFilesystem(mfs) : nullptr;
   5916 | 
   5917 |         setUnitSpecTag("");  // ###chargrove $TODO make sure this doesn't have complications w/ GW integration (shouldn't since server modded games are a separate thing)
   5918 | 
   5919 |         refreshFileSystem();
   5920 | 
   5921 |         mUIBridge->sendUISignal("server_mod_info_updated", UIBridge::MessageDelivery::Reliable);
   5922 |     }
   5923 |     else
   5924 |     {
   5925 |         ZU_Error << "ClientGame::mountServerMods: Platform Filesystem is not a MemoryFilesystem; memory files are not supported";
   5926 |     }
   5927 | }
   5928 | 
   5929 | void ClientGame::serverModsUpdated()
   5930 | {
   5931 |     if (mServerLoadedLocalModCollection != nullptr)
   5932 |     {
>  5933 |         mServerLoadedRemoteModCollection = mServerLoadedLocalModCollection->makeRemoteModCollection(platform()->getFilesystem(), mCompressServerMods);
   5934 | 
   5935 |         ZU_Info << "Mounted " << mServerLoadedRemoteModCollection->getMods().size() << " of " << mServerLoadedLocalModCollection->getMods().size()
   5936 |                 << " loaded filesystem server mods";
   5937 | 
   5938 |         if (mConnectionToServer)
   5939 |         {
   5940 |             modsSendModFileDataToServer("");  // use existing auth token
   5941 |         }
   5942 |     }
   5943 |     else
   5944 |     {
   5945 |         mServerLoadedRemoteModCollection = nullptr;
   5946 |     }
   5947 | 
   5948 |     if (mUIBridge) mUIBridge->updateCachedUnitSpecs();
   5949 | }
   5950 | 
   5951 | bool ClientGame::fileMountMemoryFiles(std::string const& memory_files)
   5952 | {
   5953 |     auto mfs = platform()->getFilesystem()->isMemoryFilesystem();
```

### .\client\client_game.cpp:7443
- Signature: L7434: void ClientGame::saveBootConfig()
```cpp
   7423 | 
   7424 |     refreshFileSystem();
   7425 | 
   7426 |     return mountsReset;
   7427 | }
   7428 | 
   7429 | std::string ClientGame::getBootConfigPath() const
   7430 | {
   7431 |     return path::join(platform()->getUserDataDir(), "boot_settings.json");
   7432 | }
   7433 | 
   7434 | void ClientGame::saveBootConfig()
   7435 | {
   7436 |     std::ofstream bootConfig;
   7437 |     crom::osutil::openFile(bootConfig, getBootConfigPath());
   7438 |     if (!bootConfig.is_open())
   7439 |         ZU_Error << "Unable to open boot config for writing: " << getBootConfigPath();
   7440 |     else
   7441 |         mBootConfig.writeTo(bootConfig, 4);
   7442 | 
>  7443 |     if (mBundleHandler) mBundleHandler->setLocale(locGetCurrentLocale());
   7444 | }
   7445 | 
   7446 | std::string ClientGame::getActiveContent() const
   7447 | {
   7448 |     std::string activeContent(mBootConfig.get("active_content").asString("BEST"));
   7449 |     return parseContent(activeContent);
   7450 | }
   7451 | 
   7452 | void ClientGame::setActiveContent(std::string content)
   7453 | {
   7454 |     if (mBootConfig.hasKey("active_content") && mBootConfig.get("active_content").asString("") == content) return;
   7455 | 
   7456 |     mBootConfig.set("active_content", Json::makeString(content));
   7457 |     saveBootConfig();
   7458 |     updateActiveContentState();
   7459 | }
   7460 | 
   7461 | void ClientGame::updateActiveContentState()
   7462 | {
   7463 |     std::string content(getActiveContent());
```

### .\client\client_game.cpp:7543
- Signature: L7538: void ClientGame::refreshFileSystem()
```cpp
   7523 | 
   7524 |     if (SteamApps())
   7525 |     {
   7526 |         for (auto&& contentEntry : s_ContentMapping)
   7527 |         {
   7528 |             std::string const& content = contentEntry.first;
   7529 |             ContentInfo const& info = contentEntry.second;
   7530 | 
   7531 |             if (SteamApps()->BIsSubscribedApp(info.appID)) ownedContent.push_back(Json::makeString(content));
   7532 |         }
   7533 |     }
   7534 | 
   7535 |     return ownedContent;
   7536 | }
   7537 | 
   7538 | void ClientGame::refreshFileSystem()
   7539 | {
   7540 |     ZU_Info << "Refreshing filesystem";
   7541 | 
   7542 |     // ensure that any changes to files in boot.json are picked up.
>  7543 |     if (mBundleHandler) mBundleHandler->reload();
   7544 | 
   7545 |     if (mCursorHandler) mCursorHandler->resetCache();
   7546 | 
   7547 |     // Similarly, icon atlases are not notified of the change in any way, so they need to be refreshed.
   7548 |     mIconAtlas.refresh();
   7549 |     mSpecialIconAtlas.refresh();
   7550 | }
   7551 | 
   7552 | std::string ClientGame::getAudioDevices() /* exposed to ui */
   7553 | {
   7554 |     HProfiler_FnZone();
   7555 | 
   7556 |     Json results(Json::makeArray());
   7557 | 
   7558 |     std::vector<AudioDevice> devices = mAudioWrapper->getDeviceNames();
   7559 | 
   7560 |     for (auto&& device : devices)
   7561 |     {
   7562 |         results.push_back(Json::makeString(device.name));
   7563 |     }
```

### .\client\client_game.cpp:7670
- Signature: L7641: void ClientGame::discordUpdateActivity(std::string payload)
```cpp
   7650 | 
   7651 |     discord::Activity activity{};
   7652 | 
   7653 |     activity.SetDetails(json.get("details").asString("").c_str());
   7654 |     activity.SetState(json.get("state").asString("").c_str());
   7655 |     activity.GetAssets().SetSmallImage(json.get("small_image").asString("").c_str());
   7656 |     activity.GetAssets().SetSmallText(json.get("small_text").asString("").c_str());
   7657 |     activity.GetAssets().SetLargeImage(json.get("large_image").asString("").c_str());
   7658 |     activity.GetAssets().SetLargeText(json.get("large_text").asString("").c_str());
   7659 | 
   7660 |     activity.SetType(json.get("playing").asBoolean(false) ? discord::ActivityType::Playing : discord::ActivityType::Watching);
   7661 | 
   7662 |     activity.GetParty().SetId(json.get("party_id").asString("").c_str());
   7663 | 
   7664 |     int players = json.get("players").asNumber(-1);
   7665 | 
   7666 |     if (players >= 0) activity.GetParty().GetSize().SetCurrentSize(players);
   7667 | 
   7668 |     int max_players = json.get("max_players").asNumber(-1);
   7669 | 
>  7670 |     if (max_players >= 0) activity.GetParty().GetSize().SetMaxSize(max_players);
   7671 | 
   7672 |     mDiscordCore->ActivityManager().UpdateActivity(activity,
   7673 |                                                    [](discord::Result result)
   7674 |                                                    {
   7675 |                                                        if (result != discord::Result::Ok) ZU_Warn << "Discord UpdateActivity failed " << static_cast<int>(result);
   7676 |                                                    });
   7677 | }
   7678 | 
   7679 | #endif
   7680 | 
   7681 | #ifdef HAVE_STEAM
   7682 | 
   7683 | void ClientGame::steamUpdateRichPresence(std::string payload)
   7684 | {
   7685 |     if (!isSteamConfirmed() || payload.empty()) return;
   7686 | 
   7687 |     Json json = zu::parseJson(payload);
   7688 | 
   7689 |     if (!json.isObject()) return;
   7690 | 
```

### .\client\client_game.h:82
- Signature: Not found within 120 lines above match
```cpp
     62 |     namespace ren
     63 |     {
     64 |         class SceneViewport;
     65 |     };
     66 | }
     67 | 
     68 | namespace zu
     69 | {
     70 |     class Json;
     71 |     class Watcher;
     72 | }
     73 | 
     74 | namespace modutil
     75 | {
     76 |     class LoadedLocalModCollection;
     77 |     class MountedLocalModCollection;
     78 |     class LoadedRemoteModCollection;
     79 |     class MountedRemoteModCollection;
     80 | }
     81 | 
>    82 | class BundleFileHandler;
     83 | class CoherentUI;
     84 | struct ModFileDataPackageBundle;
     85 | class SpecFileHandler;
     86 | class CoherentUtilProtocol;
     87 | 
     88 | class StatsViewpoint;
     89 | 
     90 | #ifdef HAVE_GOG
     91 | class GogAuthListener;
     92 | #endif
     93 | 
     94 | namespace client
     95 | {
     96 |     class ClientView;
     97 |     class ConnectionToServer;
     98 |     class Holodeck;
     99 |     class HolodeckCoherentBinder;
    100 |     struct LandingZone;
    101 |     class MessageHandlers;
    102 |     class MusicSystem;
```

### .\client\client_game.h:84
- Signature: Not found within 120 lines above match
```cpp
     64 |         class SceneViewport;
     65 |     };
     66 | }
     67 | 
     68 | namespace zu
     69 | {
     70 |     class Json;
     71 |     class Watcher;
     72 | }
     73 | 
     74 | namespace modutil
     75 | {
     76 |     class LoadedLocalModCollection;
     77 |     class MountedLocalModCollection;
     78 |     class LoadedRemoteModCollection;
     79 |     class MountedRemoteModCollection;
     80 | }
     81 | 
     82 | class BundleFileHandler;
     83 | class CoherentUI;
>    84 | struct ModFileDataPackageBundle;
     85 | class SpecFileHandler;
     86 | class CoherentUtilProtocol;
     87 | 
     88 | class StatsViewpoint;
     89 | 
     90 | #ifdef HAVE_GOG
     91 | class GogAuthListener;
     92 | #endif
     93 | 
     94 | namespace client
     95 | {
     96 |     class ClientView;
     97 |     class ConnectionToServer;
     98 |     class Holodeck;
     99 |     class HolodeckCoherentBinder;
    100 |     struct LandingZone;
    101 |     class MessageHandlers;
    102 |     class MusicSystem;
    103 |     class VenderClientStats;
    104 |     class SystemEditorView;
```

### .\client\client_game.h:351
- Signature: L272:             inline void write(std::string const& str)
```cpp
    331 |         zu::Json mJSEngineParams;
    332 | 
    333 |         std::vector<crom::ren::CameraInfo> mCameras;
    334 | 
    335 | #ifdef HAVE_STEAM
    336 |         STEAM_CALLBACK( ClientGame, OnMicroTxnAuthorization, MicroTxnAuthorizationResponse_t, mCallbackMicroTxnAuthorization );
    337 | #endif
    338 | 
    339 |         zu::probe::ScopedCaptureShutdown mCaptureShutdown;
    340 | 
    341 |         zu::Event mOverlappedUpdateComplete;
    342 | 
    343 | 
    344 |         int mActiveUberNetCalls;
    345 |         std::list<PendingUberNetCall *> mBackloggedUberNetCalls;
    346 | 
    347 |         std::vector<std::string> mFileHintRegistry;
    348 | 
    349 |         MatchmakingManager mMatchmakingManager;
    350 | 
>   351 |         std::unique_ptr<BundleFileHandler> mBundleHandler;
    352 |         std::unique_ptr<SpecFileHandler> mSpecHandler;
    353 |         std::unique_ptr<CoherentUtilProtocol> mAtlasHandler;
    354 |         std::unique_ptr<CoherentUtilProtocol> mUncachedHandler;
    355 | 
    356 |         void listErrors();
    357 |         void simulateError(std::string errorCode);
    358 | 
    359 |         std::unordered_set<std::string> const mSupportedContent;
    360 |         std::unordered_set<std::string> mOwnedContent;
    361 |         std::unordered_set<std::string> mFreeContent;
    362 |         std::string mMountedContent;
    363 | 
    364 |         zu::Json mBootConfig;
    365 | 
    366 |         std::unordered_map<std::string, std::string> mJSMemory;
    367 | 
    368 |         bool mSteamOverlayDisplayed;
    369 |         STEAM_CALLBACK(ClientGame, OnGameOverlayActivated, GameOverlayActivated_t, mCallbackGameOverlayActivated);
    370 | 
    371 |         std::unique_ptr<DownloadManager> mDownloadManager;
```

### .\client\client_game.h:375
- Signature: L272:             inline void write(std::string const& str)
```cpp
    355 | 
    356 |         void listErrors();
    357 |         void simulateError(std::string errorCode);
    358 | 
    359 |         std::unordered_set<std::string> const mSupportedContent;
    360 |         std::unordered_set<std::string> mOwnedContent;
    361 |         std::unordered_set<std::string> mFreeContent;
    362 |         std::string mMountedContent;
    363 | 
    364 |         zu::Json mBootConfig;
    365 | 
    366 |         std::unordered_map<std::string, std::string> mJSMemory;
    367 | 
    368 |         bool mSteamOverlayDisplayed;
    369 |         STEAM_CALLBACK(ClientGame, OnGameOverlayActivated, GameOverlayActivated_t, mCallbackGameOverlayActivated);
    370 | 
    371 |         std::unique_ptr<DownloadManager> mDownloadManager;
    372 | 
    373 |         std::vector<std::pair<std::string, std::string>> mMountedZips;
    374 | 
>   375 |         bool mCompressServerMods;
    376 | 
    377 |         int mSystemCores;
    378 |         int mSystemMemory;
    379 |         std::string mGraphicsVendor;
    380 |         std::string mOpenglVersion;
    381 |         std::string mOpenglRenderer;
    382 |         std::string mOpenglShaderVersion;
    383 | 
    384 |         zu::Json mFingerprint;
    385 | 
    386 |         bool mContextReady;
    387 |         bool mOffline;
    388 |         std::string mModsURL;
    389 | 
    390 |         std::string mDiscordId;
    391 |         std::string mDiscordUsername;
    392 | 
    393 | #ifdef HAVE_DISCORD
    394 |         std::unique_ptr<discord::Core> mDiscordCore;
    395 |         discord::User mDiscordCurrentUser;
```

### .\client\client_game.h:853
- Signature: Not found within 120 lines above match
```cpp
    833 |         void setOptionShadows(std::string const & value);
    834 |         void setOptionHdr(std::string const & value);
    835 |         void setOptionAA(std::string const & value);
    836 |         void setOptionAO(std::string const & value);
    837 |         void setOptionDisplayMode(std::string const & value);
    838 |         void setOptionResolutionScaling(float value);
    839 |         void setOptionUIScale(std::string const & value);
    840 |         void setVideoVolumeScale(float value);
    841 | 
    842 |         void enableLanLookout();
    843 |         void disableLanLookout();
    844 |         void lookout_NewBeacon(uint32_t ipaddr, zu::StringRange payload) override;
    845 |         void lookout_UpdateBeacon(uint32_t ipaddr, zu::StringRange payload) override;
    846 |         void lookout_LostBeacon(uint32_t ipaddr) override;
    847 | 
    848 |         void connection_ConnectionFailed() override;
    849 |         void connection_LoginAccepted(std::string version, std::string buildid, size_t replayVersion) override;
    850 |         void connection_LoginRejected() override;
    851 |         void connection_Message(zu::Json const & json) override;
    852 |         void connection_ProfilerStatsUpdated() override;
>   853 |         void connection_DownloadModFileData(ModFileDataPackageBundle const & bundle) override; 
    854 |         void connection_VisionBits(BitVectorData const & data) override;
    855 |         void connection_ControlBits(BitVectorData const & data) override;
    856 |         void connection_GameConfig(GameConfig const & config) override;
    857 |         void connection_SimCreated() override;
    858 |         void connection_SimTerminated() override;
    859 |         void connection_Disconnected() override;
    860 | 
    861 |         void setupServerMessageHandler();
    862 |         void setupClientMessageHandler();
    863 | 
    864 |         void abortPendingCalls();
    865 | 
    866 |         int queryArmyStats(int endpoint, float time);
    867 | 
    868 |         void setUIScale(float scale);
    869 | 
    870 |         bool steamOpenContentStorePage(std::string const & content);
    871 |         bool steamAddContentToCart(std::string const & content);
    872 |         bool steamLaunchContent(std::string const & content);
    873 |         bool steamIsOverlayEnabled();
```

### .\engine\crom\mod_util.cpp:11
- Signature: Not found within 120 lines above match
```cpp
      1 | #include "mod_util.h"
      2 | 
      3 | #include <engine/zu/json_util.h>
      4 | #include <engine/zu/log.h>
      5 | #include <engine/zu/pathutil.h>
      6 | #include <engine/zu/strutil.h>
      7 | #include <engine/zu/die.h>
      8 | 
      9 | #include <engine/crom/filesystem.h>
     10 | #include <engine/crom/memory_filesystem.h>
>    11 | #include <engine/crom/mod_file_data_package_bundle.h>
     12 | 
     13 | #include <lz4/lz4.h>
     14 | 
     15 | #include <fstream>
     16 | #include <stdexcept>
     17 | #include <unordered_map>
     18 | #include <unordered_set>
     19 | #include <mutex>
     20 | 
     21 | using namespace zu;
     22 | using namespace crom;
     23 | using namespace modutil;
     24 | 
     25 | // see lz4msgpip.cpp for details
     26 | size_t const MIN_COMPRESS_SIZE = 10;
     27 | 
     28 | static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
     29 | {
     30 |     auto modsArrayJson = Json::makeArray();
     31 | 
```

### .\engine\crom\mod_util.cpp:13
- Signature: Not found within 120 lines above match
```cpp
      1 | #include "mod_util.h"
      2 | 
      3 | #include <engine/zu/json_util.h>
      4 | #include <engine/zu/log.h>
      5 | #include <engine/zu/pathutil.h>
      6 | #include <engine/zu/strutil.h>
      7 | #include <engine/zu/die.h>
      8 | 
      9 | #include <engine/crom/filesystem.h>
     10 | #include <engine/crom/memory_filesystem.h>
     11 | #include <engine/crom/mod_file_data_package_bundle.h>
     12 | 
>    13 | #include <lz4/lz4.h>
     14 | 
     15 | #include <fstream>
     16 | #include <stdexcept>
     17 | #include <unordered_map>
     18 | #include <unordered_set>
     19 | #include <mutex>
     20 | 
     21 | using namespace zu;
     22 | using namespace crom;
     23 | using namespace modutil;
     24 | 
     25 | // see lz4msgpip.cpp for details
     26 | size_t const MIN_COMPRESS_SIZE = 10;
     27 | 
     28 | static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
     29 | {
     30 |     auto modsArrayJson = Json::makeArray();
     31 | 
     32 |     if (collection != nullptr)
     33 |     {
```

### .\engine\crom\mod_util.cpp:25
- Signature: Not found within 120 lines above match
```cpp
      5 | #include <engine/zu/pathutil.h>
      6 | #include <engine/zu/strutil.h>
      7 | #include <engine/zu/die.h>
      8 | 
      9 | #include <engine/crom/filesystem.h>
     10 | #include <engine/crom/memory_filesystem.h>
     11 | #include <engine/crom/mod_file_data_package_bundle.h>
     12 | 
     13 | #include <lz4/lz4.h>
     14 | 
     15 | #include <fstream>
     16 | #include <stdexcept>
     17 | #include <unordered_map>
     18 | #include <unordered_set>
     19 | #include <mutex>
     20 | 
     21 | using namespace zu;
     22 | using namespace crom;
     23 | using namespace modutil;
     24 | 
>    25 | // see lz4msgpip.cpp for details
     26 | size_t const MIN_COMPRESS_SIZE = 10;
     27 | 
     28 | static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
     29 | {
     30 |     auto modsArrayJson = Json::makeArray();
     31 | 
     32 |     if (collection != nullptr)
     33 |     {
     34 |         auto const & mods = collection->getMods();
     35 | 
     36 |         for (auto const & modInfo : mods)
     37 |         {
     38 |             auto modJson = Json::makeObject();
     39 | 
     40 |             modJson.set("identifier", encode(modInfo->identifier));
     41 |             auto deps = Json::makeArray();
     42 |             for (std::string const & dep : modInfo->dependencies)
     43 |                 deps.push_back(encode(dep));
     44 |             modJson.set("dependencies", deps);
     45 |             modJson.set("context", encode(modInfo->context_string));
```

### .\engine\crom\mod_util.cpp:26
- Signature: Not found within 120 lines above match
```cpp
      6 | #include <engine/zu/strutil.h>
      7 | #include <engine/zu/die.h>
      8 | 
      9 | #include <engine/crom/filesystem.h>
     10 | #include <engine/crom/memory_filesystem.h>
     11 | #include <engine/crom/mod_file_data_package_bundle.h>
     12 | 
     13 | #include <lz4/lz4.h>
     14 | 
     15 | #include <fstream>
     16 | #include <stdexcept>
     17 | #include <unordered_map>
     18 | #include <unordered_set>
     19 | #include <mutex>
     20 | 
     21 | using namespace zu;
     22 | using namespace crom;
     23 | using namespace modutil;
     24 | 
     25 | // see lz4msgpip.cpp for details
>    26 | size_t const MIN_COMPRESS_SIZE = 10;
     27 | 
     28 | static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
     29 | {
     30 |     auto modsArrayJson = Json::makeArray();
     31 | 
     32 |     if (collection != nullptr)
     33 |     {
     34 |         auto const & mods = collection->getMods();
     35 | 
     36 |         for (auto const & modInfo : mods)
     37 |         {
     38 |             auto modJson = Json::makeObject();
     39 | 
     40 |             modJson.set("identifier", encode(modInfo->identifier));
     41 |             auto deps = Json::makeArray();
     42 |             for (std::string const & dep : modInfo->dependencies)
     43 |                 deps.push_back(encode(dep));
     44 |             modJson.set("dependencies", deps);
     45 |             modJson.set("context", encode(modInfo->context_string));
     46 |             modJson.set("display_name", encode(modInfo->display_name));
```

### .\engine\crom\mod_util.cpp:77
- Signature: L28: static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
```cpp
     57 | }
     58 | 
     59 | class LoadedLocalModCollectionImpl
     60 |     : public LoadedLocalModCollection
     61 | {
     62 | public:
     63 |     typedef std::unordered_map<std::string, size_t> TModInfoIdentifierToModIndexMap;
     64 | 
     65 |     std::vector<std::shared_ptr<ModInfo>> mMods;
     66 |     std::vector<std::string> mModBaseDirSystemPaths;
     67 |     std::vector<size_t> mMountOrder;
     68 |     TModInfoIdentifierToModIndexMap mModInfoIdentifierToModIndexMap;
     69 | 
     70 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
     71 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
     72 |     virtual std::vector<std::string> const & getModBaseDirSystemPaths() const override { return mModBaseDirSystemPaths; }
     73 |     virtual std::vector<size_t> getMountOrder() const override { return mMountOrder; }
     74 |     virtual void setMountOrder(std::vector<size_t> const & mount_order) override { mMountOrder = mount_order; }
     75 | 
     76 |     virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) override;
>    77 |     virtual std::shared_ptr<LoadedRemoteModCollection> makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods) override;
     78 | 
     79 |     static std::shared_ptr<ModInfo> loadLocalMod(zu::RefNoCount<crom::Filesystem> fs, zu::StringRange mod_system_path, zu::StringRange expected_context);
     80 | };
     81 | 
     82 | class LoadedRemoteModCollectionImpl
     83 |     : public LoadedRemoteModCollection
     84 | {
     85 | public:
     86 | 
     87 |     LoadedRemoteModCollectionImpl();
     88 | 
     89 |     std::vector<std::shared_ptr<ModInfo>> mMods;
     90 |     ModFileDataPackageBundle mDataPackageBundle;
     91 | 
     92 |     size_t mEstimatedSize;
     93 | 
     94 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
     95 | 
     96 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
     97 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
```

### .\engine\crom\mod_util.cpp:90
- Signature: L28: static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
```cpp
     70 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
     71 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
     72 |     virtual std::vector<std::string> const & getModBaseDirSystemPaths() const override { return mModBaseDirSystemPaths; }
     73 |     virtual std::vector<size_t> getMountOrder() const override { return mMountOrder; }
     74 |     virtual void setMountOrder(std::vector<size_t> const & mount_order) override { mMountOrder = mount_order; }
     75 | 
     76 |     virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) override;
     77 |     virtual std::shared_ptr<LoadedRemoteModCollection> makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods) override;
     78 | 
     79 |     static std::shared_ptr<ModInfo> loadLocalMod(zu::RefNoCount<crom::Filesystem> fs, zu::StringRange mod_system_path, zu::StringRange expected_context);
     80 | };
     81 | 
     82 | class LoadedRemoteModCollectionImpl
     83 |     : public LoadedRemoteModCollection
     84 | {
     85 | public:
     86 | 
     87 |     LoadedRemoteModCollectionImpl();
     88 | 
     89 |     std::vector<std::shared_ptr<ModInfo>> mMods;
>    90 |     ModFileDataPackageBundle mDataPackageBundle;
     91 | 
     92 |     size_t mEstimatedSize;
     93 | 
     94 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
     95 | 
     96 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
     97 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
     98 |     virtual ModFileDataPackageBundle const & getDataPackageBundle() const override { return mDataPackageBundle; }
     99 | 
    100 |     virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) override;
    101 | 
    102 |     static std::shared_ptr<ModInfo> loadRemoteMod(ModFileDataPackage const & package, zu::StringRange expected_context);
    103 | };
    104 | 
    105 | LoadedRemoteModCollectionImpl::LoadedRemoteModCollectionImpl()
    106 |     : mEstimatedSize(0)
    107 | {
    108 | }
    109 | 
    110 | class MountedLocalModCollectionImpl
```

### .\engine\crom\mod_util.cpp:92
- Signature: L28: static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
```cpp
     72 |     virtual std::vector<std::string> const & getModBaseDirSystemPaths() const override { return mModBaseDirSystemPaths; }
     73 |     virtual std::vector<size_t> getMountOrder() const override { return mMountOrder; }
     74 |     virtual void setMountOrder(std::vector<size_t> const & mount_order) override { mMountOrder = mount_order; }
     75 | 
     76 |     virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) override;
     77 |     virtual std::shared_ptr<LoadedRemoteModCollection> makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods) override;
     78 | 
     79 |     static std::shared_ptr<ModInfo> loadLocalMod(zu::RefNoCount<crom::Filesystem> fs, zu::StringRange mod_system_path, zu::StringRange expected_context);
     80 | };
     81 | 
     82 | class LoadedRemoteModCollectionImpl
     83 |     : public LoadedRemoteModCollection
     84 | {
     85 | public:
     86 | 
     87 |     LoadedRemoteModCollectionImpl();
     88 | 
     89 |     std::vector<std::shared_ptr<ModInfo>> mMods;
     90 |     ModFileDataPackageBundle mDataPackageBundle;
     91 | 
>    92 |     size_t mEstimatedSize;
     93 | 
     94 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
     95 | 
     96 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
     97 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
     98 |     virtual ModFileDataPackageBundle const & getDataPackageBundle() const override { return mDataPackageBundle; }
     99 | 
    100 |     virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) override;
    101 | 
    102 |     static std::shared_ptr<ModInfo> loadRemoteMod(ModFileDataPackage const & package, zu::StringRange expected_context);
    103 | };
    104 | 
    105 | LoadedRemoteModCollectionImpl::LoadedRemoteModCollectionImpl()
    106 |     : mEstimatedSize(0)
    107 | {
    108 | }
    109 | 
    110 | class MountedLocalModCollectionImpl
    111 |     : public MountedLocalModCollection
    112 | {
```

### .\engine\crom\mod_util.cpp:94
- Signature: L28: static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
```cpp
     74 |     virtual void setMountOrder(std::vector<size_t> const & mount_order) override { mMountOrder = mount_order; }
     75 | 
     76 |     virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) override;
     77 |     virtual std::shared_ptr<LoadedRemoteModCollection> makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods) override;
     78 | 
     79 |     static std::shared_ptr<ModInfo> loadLocalMod(zu::RefNoCount<crom::Filesystem> fs, zu::StringRange mod_system_path, zu::StringRange expected_context);
     80 | };
     81 | 
     82 | class LoadedRemoteModCollectionImpl
     83 |     : public LoadedRemoteModCollection
     84 | {
     85 | public:
     86 | 
     87 |     LoadedRemoteModCollectionImpl();
     88 | 
     89 |     std::vector<std::shared_ptr<ModInfo>> mMods;
     90 |     ModFileDataPackageBundle mDataPackageBundle;
     91 | 
     92 |     size_t mEstimatedSize;
     93 | 
>    94 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
     95 | 
     96 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
     97 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
     98 |     virtual ModFileDataPackageBundle const & getDataPackageBundle() const override { return mDataPackageBundle; }
     99 | 
    100 |     virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) override;
    101 | 
    102 |     static std::shared_ptr<ModInfo> loadRemoteMod(ModFileDataPackage const & package, zu::StringRange expected_context);
    103 | };
    104 | 
    105 | LoadedRemoteModCollectionImpl::LoadedRemoteModCollectionImpl()
    106 |     : mEstimatedSize(0)
    107 | {
    108 | }
    109 | 
    110 | class MountedLocalModCollectionImpl
    111 |     : public MountedLocalModCollection
    112 | {
    113 | public:
    114 |     std::vector<std::shared_ptr<ModInfo>> mMods;
```

### .\engine\crom\mod_util.cpp:98
- Signature: L28: static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
```cpp
     78 | 
     79 |     static std::shared_ptr<ModInfo> loadLocalMod(zu::RefNoCount<crom::Filesystem> fs, zu::StringRange mod_system_path, zu::StringRange expected_context);
     80 | };
     81 | 
     82 | class LoadedRemoteModCollectionImpl
     83 |     : public LoadedRemoteModCollection
     84 | {
     85 | public:
     86 | 
     87 |     LoadedRemoteModCollectionImpl();
     88 | 
     89 |     std::vector<std::shared_ptr<ModInfo>> mMods;
     90 |     ModFileDataPackageBundle mDataPackageBundle;
     91 | 
     92 |     size_t mEstimatedSize;
     93 | 
     94 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
     95 | 
     96 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
     97 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
>    98 |     virtual ModFileDataPackageBundle const & getDataPackageBundle() const override { return mDataPackageBundle; }
     99 | 
    100 |     virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) override;
    101 | 
    102 |     static std::shared_ptr<ModInfo> loadRemoteMod(ModFileDataPackage const & package, zu::StringRange expected_context);
    103 | };
    104 | 
    105 | LoadedRemoteModCollectionImpl::LoadedRemoteModCollectionImpl()
    106 |     : mEstimatedSize(0)
    107 | {
    108 | }
    109 | 
    110 | class MountedLocalModCollectionImpl
    111 |     : public MountedLocalModCollection
    112 | {
    113 | public:
    114 |     std::vector<std::shared_ptr<ModInfo>> mMods;
    115 |     std::vector<std::string> mModBaseDirSystemPaths;
    116 |     zu::Ref<crom::Filesystem> mFilesystem;
    117 | 
    118 |     MountedLocalModCollectionImpl();
```

### .\engine\crom\mod_util.cpp:106
- Signature: L28: static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
```cpp
     86 | 
     87 |     LoadedRemoteModCollectionImpl();
     88 | 
     89 |     std::vector<std::shared_ptr<ModInfo>> mMods;
     90 |     ModFileDataPackageBundle mDataPackageBundle;
     91 | 
     92 |     size_t mEstimatedSize;
     93 | 
     94 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
     95 | 
     96 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
     97 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
     98 |     virtual ModFileDataPackageBundle const & getDataPackageBundle() const override { return mDataPackageBundle; }
     99 | 
    100 |     virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) override;
    101 | 
    102 |     static std::shared_ptr<ModInfo> loadRemoteMod(ModFileDataPackage const & package, zu::StringRange expected_context);
    103 | };
    104 | 
    105 | LoadedRemoteModCollectionImpl::LoadedRemoteModCollectionImpl()
>   106 |     : mEstimatedSize(0)
    107 | {
    108 | }
    109 | 
    110 | class MountedLocalModCollectionImpl
    111 |     : public MountedLocalModCollection
    112 | {
    113 | public:
    114 |     std::vector<std::shared_ptr<ModInfo>> mMods;
    115 |     std::vector<std::string> mModBaseDirSystemPaths;
    116 |     zu::Ref<crom::Filesystem> mFilesystem;
    117 | 
    118 |     MountedLocalModCollectionImpl();
    119 | 
    120 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
    121 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
    122 |     virtual std::vector<std::string> const & getModBaseDirSystemPaths() const override { return mModBaseDirSystemPaths; }
    123 |     virtual zu::RefNoCount<crom::Filesystem> getFilesystem() const override { return mFilesystem; }
    124 | };
    125 | MountedLocalModCollectionImpl::MountedLocalModCollectionImpl()
    126 | {
```

### .\engine\crom\mod_util.cpp:137
- Signature: L28: static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
```cpp
    117 | 
    118 |     MountedLocalModCollectionImpl();
    119 | 
    120 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
    121 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
    122 |     virtual std::vector<std::string> const & getModBaseDirSystemPaths() const override { return mModBaseDirSystemPaths; }
    123 |     virtual zu::RefNoCount<crom::Filesystem> getFilesystem() const override { return mFilesystem; }
    124 | };
    125 | MountedLocalModCollectionImpl::MountedLocalModCollectionImpl()
    126 | {
    127 | }
    128 | 
    129 | class MountedRemoteModCollectionImpl
    130 |     : public MountedRemoteModCollection
    131 | {
    132 | public:
    133 |     MountedRemoteModCollectionImpl();
    134 |     ~MountedRemoteModCollectionImpl();
    135 | 
    136 |     std::vector<std::shared_ptr<ModInfo>> mMods;
>   137 |     ModFileDataPackageBundle mDataPackageBundle;
    138 |     zu::Ref<crom::MemoryFilesystem> mMemoryFilesystem;
    139 |     mutable std::mutex mMountedMutex;
    140 |     bool mMounted;
    141 | 
    142 |     size_t mEstimatedSize;
    143 | 
    144 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
    145 | 
    146 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
    147 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
    148 |     virtual ModFileDataPackageBundle const & getDataPackageBundle() const override { return mDataPackageBundle; }
    149 |     virtual zu::Ref<crom::MemoryFilesystem> getMemoryFilesystem() const override { return mMemoryFilesystem; }
    150 |     virtual void unmount() override;
    151 | };
    152 | MountedRemoteModCollectionImpl::MountedRemoteModCollectionImpl()
    153 |     : mMounted(false)
    154 |     , mEstimatedSize(0)
    155 | {
    156 | }
    157 | MountedRemoteModCollectionImpl::~MountedRemoteModCollectionImpl()
```

### .\engine\crom\mod_util.cpp:142
- Signature: L28: static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
```cpp
    122 |     virtual std::vector<std::string> const & getModBaseDirSystemPaths() const override { return mModBaseDirSystemPaths; }
    123 |     virtual zu::RefNoCount<crom::Filesystem> getFilesystem() const override { return mFilesystem; }
    124 | };
    125 | MountedLocalModCollectionImpl::MountedLocalModCollectionImpl()
    126 | {
    127 | }
    128 | 
    129 | class MountedRemoteModCollectionImpl
    130 |     : public MountedRemoteModCollection
    131 | {
    132 | public:
    133 |     MountedRemoteModCollectionImpl();
    134 |     ~MountedRemoteModCollectionImpl();
    135 | 
    136 |     std::vector<std::shared_ptr<ModInfo>> mMods;
    137 |     ModFileDataPackageBundle mDataPackageBundle;
    138 |     zu::Ref<crom::MemoryFilesystem> mMemoryFilesystem;
    139 |     mutable std::mutex mMountedMutex;
    140 |     bool mMounted;
    141 | 
>   142 |     size_t mEstimatedSize;
    143 | 
    144 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
    145 | 
    146 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
    147 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
    148 |     virtual ModFileDataPackageBundle const & getDataPackageBundle() const override { return mDataPackageBundle; }
    149 |     virtual zu::Ref<crom::MemoryFilesystem> getMemoryFilesystem() const override { return mMemoryFilesystem; }
    150 |     virtual void unmount() override;
    151 | };
    152 | MountedRemoteModCollectionImpl::MountedRemoteModCollectionImpl()
    153 |     : mMounted(false)
    154 |     , mEstimatedSize(0)
    155 | {
    156 | }
    157 | MountedRemoteModCollectionImpl::~MountedRemoteModCollectionImpl()
    158 | {
    159 |     unmount();
    160 | }
    161 | void MountedRemoteModCollectionImpl::unmount()
    162 | {
```

### .\engine\crom\mod_util.cpp:144
- Signature: L28: static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
```cpp
    124 | };
    125 | MountedLocalModCollectionImpl::MountedLocalModCollectionImpl()
    126 | {
    127 | }
    128 | 
    129 | class MountedRemoteModCollectionImpl
    130 |     : public MountedRemoteModCollection
    131 | {
    132 | public:
    133 |     MountedRemoteModCollectionImpl();
    134 |     ~MountedRemoteModCollectionImpl();
    135 | 
    136 |     std::vector<std::shared_ptr<ModInfo>> mMods;
    137 |     ModFileDataPackageBundle mDataPackageBundle;
    138 |     zu::Ref<crom::MemoryFilesystem> mMemoryFilesystem;
    139 |     mutable std::mutex mMountedMutex;
    140 |     bool mMounted;
    141 | 
    142 |     size_t mEstimatedSize;
    143 | 
>   144 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
    145 | 
    146 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
    147 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
    148 |     virtual ModFileDataPackageBundle const & getDataPackageBundle() const override { return mDataPackageBundle; }
    149 |     virtual zu::Ref<crom::MemoryFilesystem> getMemoryFilesystem() const override { return mMemoryFilesystem; }
    150 |     virtual void unmount() override;
    151 | };
    152 | MountedRemoteModCollectionImpl::MountedRemoteModCollectionImpl()
    153 |     : mMounted(false)
    154 |     , mEstimatedSize(0)
    155 | {
    156 | }
    157 | MountedRemoteModCollectionImpl::~MountedRemoteModCollectionImpl()
    158 | {
    159 |     unmount();
    160 | }
    161 | void MountedRemoteModCollectionImpl::unmount()
    162 | {
    163 |     std::lock_guard<std::mutex> lock(mMountedMutex);
    164 | 
```

### .\engine\crom\mod_util.cpp:148
- Signature: L28: static zu::Json getModsJsonArrayForCollection(ModCollection const * collection)
```cpp
    128 | 
    129 | class MountedRemoteModCollectionImpl
    130 |     : public MountedRemoteModCollection
    131 | {
    132 | public:
    133 |     MountedRemoteModCollectionImpl();
    134 |     ~MountedRemoteModCollectionImpl();
    135 | 
    136 |     std::vector<std::shared_ptr<ModInfo>> mMods;
    137 |     ModFileDataPackageBundle mDataPackageBundle;
    138 |     zu::Ref<crom::MemoryFilesystem> mMemoryFilesystem;
    139 |     mutable std::mutex mMountedMutex;
    140 |     bool mMounted;
    141 | 
    142 |     size_t mEstimatedSize;
    143 | 
    144 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
    145 | 
    146 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
    147 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
>   148 |     virtual ModFileDataPackageBundle const & getDataPackageBundle() const override { return mDataPackageBundle; }
    149 |     virtual zu::Ref<crom::MemoryFilesystem> getMemoryFilesystem() const override { return mMemoryFilesystem; }
    150 |     virtual void unmount() override;
    151 | };
    152 | MountedRemoteModCollectionImpl::MountedRemoteModCollectionImpl()
    153 |     : mMounted(false)
    154 |     , mEstimatedSize(0)
    155 | {
    156 | }
    157 | MountedRemoteModCollectionImpl::~MountedRemoteModCollectionImpl()
    158 | {
    159 |     unmount();
    160 | }
    161 | void MountedRemoteModCollectionImpl::unmount()
    162 | {
    163 |     std::lock_guard<std::mutex> lock(mMountedMutex);
    164 | 
    165 |     if (mMounted)
    166 |     {
    167 |         mMemoryFilesystem->unmountAllMemoryFiles();
    168 |         mMounted = false;
```

### .\engine\crom\mod_util.cpp:154
- Signature: Not found within 120 lines above match
```cpp
    134 |     ~MountedRemoteModCollectionImpl();
    135 | 
    136 |     std::vector<std::shared_ptr<ModInfo>> mMods;
    137 |     ModFileDataPackageBundle mDataPackageBundle;
    138 |     zu::Ref<crom::MemoryFilesystem> mMemoryFilesystem;
    139 |     mutable std::mutex mMountedMutex;
    140 |     bool mMounted;
    141 | 
    142 |     size_t mEstimatedSize;
    143 | 
    144 |     virtual size_t const & getEstimatedSize() const override { return mEstimatedSize; }
    145 | 
    146 |     virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const override { return mMods; }
    147 |     virtual zu::Json getModsJsonArray() const override { return getModsJsonArrayForCollection(this); }
    148 |     virtual ModFileDataPackageBundle const & getDataPackageBundle() const override { return mDataPackageBundle; }
    149 |     virtual zu::Ref<crom::MemoryFilesystem> getMemoryFilesystem() const override { return mMemoryFilesystem; }
    150 |     virtual void unmount() override;
    151 | };
    152 | MountedRemoteModCollectionImpl::MountedRemoteModCollectionImpl()
    153 |     : mMounted(false)
>   154 |     , mEstimatedSize(0)
    155 | {
    156 | }
    157 | MountedRemoteModCollectionImpl::~MountedRemoteModCollectionImpl()
    158 | {
    159 |     unmount();
    160 | }
    161 | void MountedRemoteModCollectionImpl::unmount()
    162 | {
    163 |     std::lock_guard<std::mutex> lock(mMountedMutex);
    164 | 
    165 |     if (mMounted)
    166 |     {
    167 |         mMemoryFilesystem->unmountAllMemoryFiles();
    168 |         mMounted = false;
    169 |     }
    170 | }
    171 | 
    172 | static void requireString(Json const & json, std::string const & str, std::string & out)
    173 | {
    174 |     if (json.hasKey(str))
```

### .\engine\crom\mod_util.cpp:461
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    441 |                 continue;
    442 |             if (newPath[0] != '/')
    443 |                 newPath = std::string("/") + newPath;
    444 | 
    445 | #ifdef COMMON_FILESYSTEM
    446 |             fs->alias(file, newPath, true);
    447 | #else
    448 |             fs->alias(file, newPath);
    449 | #endif
    450 |         }
    451 |     }
    452 | 
    453 |     // once we've mounted all of our mods onto the file system, it becomes locked against further mounting
    454 |     fs->setMountsLocked();
    455 | 
    456 |     result->mModBaseDirSystemPaths = mModBaseDirSystemPaths;
    457 |     result->mFilesystem = fs;
    458 | 
    459 |     return result;
    460 | }
>   461 | std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
    462 | {
    463 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    464 | 
    465 |     size_t estimated_size = 0;
    466 | 
    467 |     size_t mod_count = mMods.size();
    468 |     for (size_t mod_index : mMountOrder)
    469 |     {
    470 |         if (mod_index >= mod_count)
    471 |         {
    472 |             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Out-of-bounds mod index in mount order " << mod_index << ", count is " << mod_count << ", skipping.";
    473 |         }
    474 | 
    475 |         auto const & mod = mMods[mod_index];
    476 | 
    477 |         result->mMods.push_back(mod);
    478 | 
    479 |         std::string base_path = mod->mod_system_path;
    480 |         if (zu::StringRange(path::nativeToPosix(base_path)).endsWith("/"))
    481 |             base_path = base_path.substr(0, base_path.length() - 1);
```

### .\engine\crom\mod_util.cpp:465
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    445 | #ifdef COMMON_FILESYSTEM
    446 |             fs->alias(file, newPath, true);
    447 | #else
    448 |             fs->alias(file, newPath);
    449 | #endif
    450 |         }
    451 |     }
    452 | 
    453 |     // once we've mounted all of our mods onto the file system, it becomes locked against further mounting
    454 |     fs->setMountsLocked();
    455 | 
    456 |     result->mModBaseDirSystemPaths = mModBaseDirSystemPaths;
    457 |     result->mFilesystem = fs;
    458 | 
    459 |     return result;
    460 | }
    461 | std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
    462 | {
    463 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    464 | 
>   465 |     size_t estimated_size = 0;
    466 | 
    467 |     size_t mod_count = mMods.size();
    468 |     for (size_t mod_index : mMountOrder)
    469 |     {
    470 |         if (mod_index >= mod_count)
    471 |         {
    472 |             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Out-of-bounds mod index in mount order " << mod_index << ", count is " << mod_count << ", skipping.";
    473 |         }
    474 | 
    475 |         auto const & mod = mMods[mod_index];
    476 | 
    477 |         result->mMods.push_back(mod);
    478 | 
    479 |         std::string base_path = mod->mod_system_path;
    480 |         if (zu::StringRange(path::nativeToPosix(base_path)).endsWith("/"))
    481 |             base_path = base_path.substr(0, base_path.length() - 1);
    482 | 
    483 |         std::vector<FileInfo> files;
    484 |         if (!fs->listDir(base_path, files, ListDirRecurse::Yes))
    485 |         {
```

### .\engine\crom\mod_util.cpp:535
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    515 |                     {
    516 |                         uint8_t * fileBytes = reinterpret_cast<uint8_t *>(ZU_MALLOC(fileSize));
    517 | 
    518 |                         if (fileBytes == nullptr)
    519 |                             throw std::bad_alloc();
    520 | 
    521 |                         int64_t readSize = f->read(fileBytes, fileSize);
    522 | 
    523 |                         if (readSize != fileSize)
    524 |                         {
    525 |                             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Incomplete read of file " << file.name << ", " << readSize << " of " << fileSize << " bytes";
    526 |                         }
    527 |                         else
    528 |                         {
    529 |                             if (fileSize > std::numeric_limits<uint32_t>::max())
    530 |                             {
    531 |                                 ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: fileSize larger than available buffer. Tell the develoeprs to increase allowable file size in ModFileDataEntry.";
    532 |                             }
    533 |                             entry.fileSize = (uint32_t) fileSize;
    534 | 
>   535 |                             if (compressServerMods)
    536 |                             {
    537 |                                 int max_compressed_size = (int)LZ4_COMPRESSBOUND(fileSize);
    538 | 
    539 |                                 if ((size_t)fileSize >= MIN_COMPRESS_SIZE && max_compressed_size)
    540 |                                 {
    541 |                                     entry.fileBytes.resize(max_compressed_size);
    542 | 
    543 |                                     int compressed_size = (int) LZ4_compress_default(reinterpret_cast<char const *>(&fileBytes[0]), reinterpret_cast<char *>(&entry.fileBytes[0]), (int)fileSize, max_compressed_size);
    544 | 
    545 |                                     if (compressed_size > 0)
    546 |                                     {
    547 |                                         entry.isCompressed = true;
    548 |                                         entry.fileBytes.resize(compressed_size);
    549 |                                     }
    550 |                                     else
    551 |                                     {
    552 |                                         ZU_Error << "LZ4_compress failed for " << entry.fileName;
    553 |                                     }
    554 |                                 }
    555 |                             }
```

### .\engine\crom\mod_util.cpp:537
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    517 | 
    518 |                         if (fileBytes == nullptr)
    519 |                             throw std::bad_alloc();
    520 | 
    521 |                         int64_t readSize = f->read(fileBytes, fileSize);
    522 | 
    523 |                         if (readSize != fileSize)
    524 |                         {
    525 |                             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Incomplete read of file " << file.name << ", " << readSize << " of " << fileSize << " bytes";
    526 |                         }
    527 |                         else
    528 |                         {
    529 |                             if (fileSize > std::numeric_limits<uint32_t>::max())
    530 |                             {
    531 |                                 ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: fileSize larger than available buffer. Tell the develoeprs to increase allowable file size in ModFileDataEntry.";
    532 |                             }
    533 |                             entry.fileSize = (uint32_t) fileSize;
    534 | 
    535 |                             if (compressServerMods)
    536 |                             {
>   537 |                                 int max_compressed_size = (int)LZ4_COMPRESSBOUND(fileSize);
    538 | 
    539 |                                 if ((size_t)fileSize >= MIN_COMPRESS_SIZE && max_compressed_size)
    540 |                                 {
    541 |                                     entry.fileBytes.resize(max_compressed_size);
    542 | 
    543 |                                     int compressed_size = (int) LZ4_compress_default(reinterpret_cast<char const *>(&fileBytes[0]), reinterpret_cast<char *>(&entry.fileBytes[0]), (int)fileSize, max_compressed_size);
    544 | 
    545 |                                     if (compressed_size > 0)
    546 |                                     {
    547 |                                         entry.isCompressed = true;
    548 |                                         entry.fileBytes.resize(compressed_size);
    549 |                                     }
    550 |                                     else
    551 |                                     {
    552 |                                         ZU_Error << "LZ4_compress failed for " << entry.fileName;
    553 |                                     }
    554 |                                 }
    555 |                             }
    556 | 
    557 |                             if (!entry.isCompressed)
```

### .\engine\crom\mod_util.cpp:539
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    519 |                             throw std::bad_alloc();
    520 | 
    521 |                         int64_t readSize = f->read(fileBytes, fileSize);
    522 | 
    523 |                         if (readSize != fileSize)
    524 |                         {
    525 |                             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Incomplete read of file " << file.name << ", " << readSize << " of " << fileSize << " bytes";
    526 |                         }
    527 |                         else
    528 |                         {
    529 |                             if (fileSize > std::numeric_limits<uint32_t>::max())
    530 |                             {
    531 |                                 ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: fileSize larger than available buffer. Tell the develoeprs to increase allowable file size in ModFileDataEntry.";
    532 |                             }
    533 |                             entry.fileSize = (uint32_t) fileSize;
    534 | 
    535 |                             if (compressServerMods)
    536 |                             {
    537 |                                 int max_compressed_size = (int)LZ4_COMPRESSBOUND(fileSize);
    538 | 
>   539 |                                 if ((size_t)fileSize >= MIN_COMPRESS_SIZE && max_compressed_size)
    540 |                                 {
    541 |                                     entry.fileBytes.resize(max_compressed_size);
    542 | 
    543 |                                     int compressed_size = (int) LZ4_compress_default(reinterpret_cast<char const *>(&fileBytes[0]), reinterpret_cast<char *>(&entry.fileBytes[0]), (int)fileSize, max_compressed_size);
    544 | 
    545 |                                     if (compressed_size > 0)
    546 |                                     {
    547 |                                         entry.isCompressed = true;
    548 |                                         entry.fileBytes.resize(compressed_size);
    549 |                                     }
    550 |                                     else
    551 |                                     {
    552 |                                         ZU_Error << "LZ4_compress failed for " << entry.fileName;
    553 |                                     }
    554 |                                 }
    555 |                             }
    556 | 
    557 |                             if (!entry.isCompressed)
    558 |                             {
    559 |                                 entry.fileBytes.resize(fileSize);
```

### .\engine\crom\mod_util.cpp:541
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    521 |                         int64_t readSize = f->read(fileBytes, fileSize);
    522 | 
    523 |                         if (readSize != fileSize)
    524 |                         {
    525 |                             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Incomplete read of file " << file.name << ", " << readSize << " of " << fileSize << " bytes";
    526 |                         }
    527 |                         else
    528 |                         {
    529 |                             if (fileSize > std::numeric_limits<uint32_t>::max())
    530 |                             {
    531 |                                 ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: fileSize larger than available buffer. Tell the develoeprs to increase allowable file size in ModFileDataEntry.";
    532 |                             }
    533 |                             entry.fileSize = (uint32_t) fileSize;
    534 | 
    535 |                             if (compressServerMods)
    536 |                             {
    537 |                                 int max_compressed_size = (int)LZ4_COMPRESSBOUND(fileSize);
    538 | 
    539 |                                 if ((size_t)fileSize >= MIN_COMPRESS_SIZE && max_compressed_size)
    540 |                                 {
>   541 |                                     entry.fileBytes.resize(max_compressed_size);
    542 | 
    543 |                                     int compressed_size = (int) LZ4_compress_default(reinterpret_cast<char const *>(&fileBytes[0]), reinterpret_cast<char *>(&entry.fileBytes[0]), (int)fileSize, max_compressed_size);
    544 | 
    545 |                                     if (compressed_size > 0)
    546 |                                     {
    547 |                                         entry.isCompressed = true;
    548 |                                         entry.fileBytes.resize(compressed_size);
    549 |                                     }
    550 |                                     else
    551 |                                     {
    552 |                                         ZU_Error << "LZ4_compress failed for " << entry.fileName;
    553 |                                     }
    554 |                                 }
    555 |                             }
    556 | 
    557 |                             if (!entry.isCompressed)
    558 |                             {
    559 |                                 entry.fileBytes.resize(fileSize);
    560 |                                 memcpy(entry.fileBytes.data(), fileBytes, fileSize);
    561 |                             }
```

### .\engine\crom\mod_util.cpp:543
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    523 |                         if (readSize != fileSize)
    524 |                         {
    525 |                             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Incomplete read of file " << file.name << ", " << readSize << " of " << fileSize << " bytes";
    526 |                         }
    527 |                         else
    528 |                         {
    529 |                             if (fileSize > std::numeric_limits<uint32_t>::max())
    530 |                             {
    531 |                                 ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: fileSize larger than available buffer. Tell the develoeprs to increase allowable file size in ModFileDataEntry.";
    532 |                             }
    533 |                             entry.fileSize = (uint32_t) fileSize;
    534 | 
    535 |                             if (compressServerMods)
    536 |                             {
    537 |                                 int max_compressed_size = (int)LZ4_COMPRESSBOUND(fileSize);
    538 | 
    539 |                                 if ((size_t)fileSize >= MIN_COMPRESS_SIZE && max_compressed_size)
    540 |                                 {
    541 |                                     entry.fileBytes.resize(max_compressed_size);
    542 | 
>   543 |                                     int compressed_size = (int) LZ4_compress_default(reinterpret_cast<char const *>(&fileBytes[0]), reinterpret_cast<char *>(&entry.fileBytes[0]), (int)fileSize, max_compressed_size);
    544 | 
    545 |                                     if (compressed_size > 0)
    546 |                                     {
    547 |                                         entry.isCompressed = true;
    548 |                                         entry.fileBytes.resize(compressed_size);
    549 |                                     }
    550 |                                     else
    551 |                                     {
    552 |                                         ZU_Error << "LZ4_compress failed for " << entry.fileName;
    553 |                                     }
    554 |                                 }
    555 |                             }
    556 | 
    557 |                             if (!entry.isCompressed)
    558 |                             {
    559 |                                 entry.fileBytes.resize(fileSize);
    560 |                                 memcpy(entry.fileBytes.data(), fileBytes, fileSize);
    561 |                             }
    562 |                         }
    563 | 
```

### .\engine\crom\mod_util.cpp:545
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    525 |                             ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Incomplete read of file " << file.name << ", " << readSize << " of " << fileSize << " bytes";
    526 |                         }
    527 |                         else
    528 |                         {
    529 |                             if (fileSize > std::numeric_limits<uint32_t>::max())
    530 |                             {
    531 |                                 ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: fileSize larger than available buffer. Tell the develoeprs to increase allowable file size in ModFileDataEntry.";
    532 |                             }
    533 |                             entry.fileSize = (uint32_t) fileSize;
    534 | 
    535 |                             if (compressServerMods)
    536 |                             {
    537 |                                 int max_compressed_size = (int)LZ4_COMPRESSBOUND(fileSize);
    538 | 
    539 |                                 if ((size_t)fileSize >= MIN_COMPRESS_SIZE && max_compressed_size)
    540 |                                 {
    541 |                                     entry.fileBytes.resize(max_compressed_size);
    542 | 
    543 |                                     int compressed_size = (int) LZ4_compress_default(reinterpret_cast<char const *>(&fileBytes[0]), reinterpret_cast<char *>(&entry.fileBytes[0]), (int)fileSize, max_compressed_size);
    544 | 
>   545 |                                     if (compressed_size > 0)
    546 |                                     {
    547 |                                         entry.isCompressed = true;
    548 |                                         entry.fileBytes.resize(compressed_size);
    549 |                                     }
    550 |                                     else
    551 |                                     {
    552 |                                         ZU_Error << "LZ4_compress failed for " << entry.fileName;
    553 |                                     }
    554 |                                 }
    555 |                             }
    556 | 
    557 |                             if (!entry.isCompressed)
    558 |                             {
    559 |                                 entry.fileBytes.resize(fileSize);
    560 |                                 memcpy(entry.fileBytes.data(), fileBytes, fileSize);
    561 |                             }
    562 |                         }
    563 | 
    564 |                         if (fileBytes)
    565 |                         {
```

### .\engine\crom\mod_util.cpp:547
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    527 |                         else
    528 |                         {
    529 |                             if (fileSize > std::numeric_limits<uint32_t>::max())
    530 |                             {
    531 |                                 ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: fileSize larger than available buffer. Tell the develoeprs to increase allowable file size in ModFileDataEntry.";
    532 |                             }
    533 |                             entry.fileSize = (uint32_t) fileSize;
    534 | 
    535 |                             if (compressServerMods)
    536 |                             {
    537 |                                 int max_compressed_size = (int)LZ4_COMPRESSBOUND(fileSize);
    538 | 
    539 |                                 if ((size_t)fileSize >= MIN_COMPRESS_SIZE && max_compressed_size)
    540 |                                 {
    541 |                                     entry.fileBytes.resize(max_compressed_size);
    542 | 
    543 |                                     int compressed_size = (int) LZ4_compress_default(reinterpret_cast<char const *>(&fileBytes[0]), reinterpret_cast<char *>(&entry.fileBytes[0]), (int)fileSize, max_compressed_size);
    544 | 
    545 |                                     if (compressed_size > 0)
    546 |                                     {
>   547 |                                         entry.isCompressed = true;
    548 |                                         entry.fileBytes.resize(compressed_size);
    549 |                                     }
    550 |                                     else
    551 |                                     {
    552 |                                         ZU_Error << "LZ4_compress failed for " << entry.fileName;
    553 |                                     }
    554 |                                 }
    555 |                             }
    556 | 
    557 |                             if (!entry.isCompressed)
    558 |                             {
    559 |                                 entry.fileBytes.resize(fileSize);
    560 |                                 memcpy(entry.fileBytes.data(), fileBytes, fileSize);
    561 |                             }
    562 |                         }
    563 | 
    564 |                         if (fileBytes)
    565 |                         {
    566 |                             ZU_FREE(fileBytes);
    567 |                             fileBytes = nullptr;
```

### .\engine\crom\mod_util.cpp:548
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    528 |                         {
    529 |                             if (fileSize > std::numeric_limits<uint32_t>::max())
    530 |                             {
    531 |                                 ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: fileSize larger than available buffer. Tell the develoeprs to increase allowable file size in ModFileDataEntry.";
    532 |                             }
    533 |                             entry.fileSize = (uint32_t) fileSize;
    534 | 
    535 |                             if (compressServerMods)
    536 |                             {
    537 |                                 int max_compressed_size = (int)LZ4_COMPRESSBOUND(fileSize);
    538 | 
    539 |                                 if ((size_t)fileSize >= MIN_COMPRESS_SIZE && max_compressed_size)
    540 |                                 {
    541 |                                     entry.fileBytes.resize(max_compressed_size);
    542 | 
    543 |                                     int compressed_size = (int) LZ4_compress_default(reinterpret_cast<char const *>(&fileBytes[0]), reinterpret_cast<char *>(&entry.fileBytes[0]), (int)fileSize, max_compressed_size);
    544 | 
    545 |                                     if (compressed_size > 0)
    546 |                                     {
    547 |                                         entry.isCompressed = true;
>   548 |                                         entry.fileBytes.resize(compressed_size);
    549 |                                     }
    550 |                                     else
    551 |                                     {
    552 |                                         ZU_Error << "LZ4_compress failed for " << entry.fileName;
    553 |                                     }
    554 |                                 }
    555 |                             }
    556 | 
    557 |                             if (!entry.isCompressed)
    558 |                             {
    559 |                                 entry.fileBytes.resize(fileSize);
    560 |                                 memcpy(entry.fileBytes.data(), fileBytes, fileSize);
    561 |                             }
    562 |                         }
    563 | 
    564 |                         if (fileBytes)
    565 |                         {
    566 |                             ZU_FREE(fileBytes);
    567 |                             fileBytes = nullptr;
    568 |                         }
```

### .\engine\crom\mod_util.cpp:552
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    532 |                             }
    533 |                             entry.fileSize = (uint32_t) fileSize;
    534 | 
    535 |                             if (compressServerMods)
    536 |                             {
    537 |                                 int max_compressed_size = (int)LZ4_COMPRESSBOUND(fileSize);
    538 | 
    539 |                                 if ((size_t)fileSize >= MIN_COMPRESS_SIZE && max_compressed_size)
    540 |                                 {
    541 |                                     entry.fileBytes.resize(max_compressed_size);
    542 | 
    543 |                                     int compressed_size = (int) LZ4_compress_default(reinterpret_cast<char const *>(&fileBytes[0]), reinterpret_cast<char *>(&entry.fileBytes[0]), (int)fileSize, max_compressed_size);
    544 | 
    545 |                                     if (compressed_size > 0)
    546 |                                     {
    547 |                                         entry.isCompressed = true;
    548 |                                         entry.fileBytes.resize(compressed_size);
    549 |                                     }
    550 |                                     else
    551 |                                     {
>   552 |                                         ZU_Error << "LZ4_compress failed for " << entry.fileName;
    553 |                                     }
    554 |                                 }
    555 |                             }
    556 | 
    557 |                             if (!entry.isCompressed)
    558 |                             {
    559 |                                 entry.fileBytes.resize(fileSize);
    560 |                                 memcpy(entry.fileBytes.data(), fileBytes, fileSize);
    561 |                             }
    562 |                         }
    563 | 
    564 |                         if (fileBytes)
    565 |                         {
    566 |                             ZU_FREE(fileBytes);
    567 |                             fileBytes = nullptr;
    568 |                         }
    569 |                     }
    570 |                 }
    571 |                 else
    572 |                 {
```

### .\engine\crom\mod_util.cpp:557
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    537 |                                 int max_compressed_size = (int)LZ4_COMPRESSBOUND(fileSize);
    538 | 
    539 |                                 if ((size_t)fileSize >= MIN_COMPRESS_SIZE && max_compressed_size)
    540 |                                 {
    541 |                                     entry.fileBytes.resize(max_compressed_size);
    542 | 
    543 |                                     int compressed_size = (int) LZ4_compress_default(reinterpret_cast<char const *>(&fileBytes[0]), reinterpret_cast<char *>(&entry.fileBytes[0]), (int)fileSize, max_compressed_size);
    544 | 
    545 |                                     if (compressed_size > 0)
    546 |                                     {
    547 |                                         entry.isCompressed = true;
    548 |                                         entry.fileBytes.resize(compressed_size);
    549 |                                     }
    550 |                                     else
    551 |                                     {
    552 |                                         ZU_Error << "LZ4_compress failed for " << entry.fileName;
    553 |                                     }
    554 |                                 }
    555 |                             }
    556 | 
>   557 |                             if (!entry.isCompressed)
    558 |                             {
    559 |                                 entry.fileBytes.resize(fileSize);
    560 |                                 memcpy(entry.fileBytes.data(), fileBytes, fileSize);
    561 |                             }
    562 |                         }
    563 | 
    564 |                         if (fileBytes)
    565 |                         {
    566 |                             ZU_FREE(fileBytes);
    567 |                             fileBytes = nullptr;
    568 |                         }
    569 |                     }
    570 |                 }
    571 |                 else
    572 |                 {
    573 |                     ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Unable to open file " << file.name;
    574 |                 }
    575 |             }
    576 | 
    577 |             estimated_size += entry.fileSize + entry.fileName.length() + 1;
```

### .\engine\crom\mod_util.cpp:577
- Signature: L461: std::shared_ptr<LoadedRemoteModCollection> LoadedLocalModCollectionImpl::makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compressServerMods)
```cpp
    557 |                             if (!entry.isCompressed)
    558 |                             {
    559 |                                 entry.fileBytes.resize(fileSize);
    560 |                                 memcpy(entry.fileBytes.data(), fileBytes, fileSize);
    561 |                             }
    562 |                         }
    563 | 
    564 |                         if (fileBytes)
    565 |                         {
    566 |                             ZU_FREE(fileBytes);
    567 |                             fileBytes = nullptr;
    568 |                         }
    569 |                     }
    570 |                 }
    571 |                 else
    572 |                 {
    573 |                     ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Unable to open file " << file.name;
    574 |                 }
    575 |             }
    576 | 
>   577 |             estimated_size += entry.fileSize + entry.fileName.length() + 1;
    578 |             if (entry.fileSize)
    579 |             {
    580 |                 ZU_ASSERT_BREAK(entry.fileBytes.size() > 0);
    581 |             }
    582 |             package.entries.push_back(std::move(entry));
    583 |         }
    584 | 
    585 |         result->mEstimatedSize = estimated_size;
    586 | 
    587 |         result->mDataPackageBundle.packages.push_back(std::move(package));
    588 |     }
    589 | 
    590 |     return result;
    591 | }
    592 | 
    593 | std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
    594 | {
    595 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    596 | 
    597 |     for (auto const & package : bundle.packages)
```

### .\engine\crom\mod_util.cpp:585
- Signature: Not found within 120 lines above match
```cpp
    565 |                         {
    566 |                             ZU_FREE(fileBytes);
    567 |                             fileBytes = nullptr;
    568 |                         }
    569 |                     }
    570 |                 }
    571 |                 else
    572 |                 {
    573 |                     ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Unable to open file " << file.name;
    574 |                 }
    575 |             }
    576 | 
    577 |             estimated_size += entry.fileSize + entry.fileName.length() + 1;
    578 |             if (entry.fileSize)
    579 |             {
    580 |                 ZU_ASSERT_BREAK(entry.fileBytes.size() > 0);
    581 |             }
    582 |             package.entries.push_back(std::move(entry));
    583 |         }
    584 | 
>   585 |         result->mEstimatedSize = estimated_size;
    586 | 
    587 |         result->mDataPackageBundle.packages.push_back(std::move(package));
    588 |     }
    589 | 
    590 |     return result;
    591 | }
    592 | 
    593 | std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
    594 | {
    595 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    596 | 
    597 |     for (auto const & package : bundle.packages)
    598 |     {
    599 |         auto loadedMod = LoadedRemoteModCollectionImpl::loadRemoteMod(package, expected_context);
    600 |         if (loadedMod != nullptr)
    601 |         {
    602 |             result->mMods.push_back(loadedMod);
    603 |             result->mDataPackageBundle.packages.push_back(package);
    604 |         }
    605 |     }
```

### .\engine\crom\mod_util.cpp:587
- Signature: Not found within 120 lines above match
```cpp
    567 |                             fileBytes = nullptr;
    568 |                         }
    569 |                     }
    570 |                 }
    571 |                 else
    572 |                 {
    573 |                     ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Unable to open file " << file.name;
    574 |                 }
    575 |             }
    576 | 
    577 |             estimated_size += entry.fileSize + entry.fileName.length() + 1;
    578 |             if (entry.fileSize)
    579 |             {
    580 |                 ZU_ASSERT_BREAK(entry.fileBytes.size() > 0);
    581 |             }
    582 |             package.entries.push_back(std::move(entry));
    583 |         }
    584 | 
    585 |         result->mEstimatedSize = estimated_size;
    586 | 
>   587 |         result->mDataPackageBundle.packages.push_back(std::move(package));
    588 |     }
    589 | 
    590 |     return result;
    591 | }
    592 | 
    593 | std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
    594 | {
    595 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    596 | 
    597 |     for (auto const & package : bundle.packages)
    598 |     {
    599 |         auto loadedMod = LoadedRemoteModCollectionImpl::loadRemoteMod(package, expected_context);
    600 |         if (loadedMod != nullptr)
    601 |         {
    602 |             result->mMods.push_back(loadedMod);
    603 |             result->mDataPackageBundle.packages.push_back(package);
    604 |         }
    605 |     }
    606 | 
    607 |     return result;
```

### .\engine\crom\mod_util.cpp:593
- Signature: L593: std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
```cpp
    573 |                     ZU_Error << "LoadedLocalModCollectionImpl::makeRemoteModCollection: Unable to open file " << file.name;
    574 |                 }
    575 |             }
    576 | 
    577 |             estimated_size += entry.fileSize + entry.fileName.length() + 1;
    578 |             if (entry.fileSize)
    579 |             {
    580 |                 ZU_ASSERT_BREAK(entry.fileBytes.size() > 0);
    581 |             }
    582 |             package.entries.push_back(std::move(entry));
    583 |         }
    584 | 
    585 |         result->mEstimatedSize = estimated_size;
    586 | 
    587 |         result->mDataPackageBundle.packages.push_back(std::move(package));
    588 |     }
    589 | 
    590 |     return result;
    591 | }
    592 | 
>   593 | std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
    594 | {
    595 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    596 | 
    597 |     for (auto const & package : bundle.packages)
    598 |     {
    599 |         auto loadedMod = LoadedRemoteModCollectionImpl::loadRemoteMod(package, expected_context);
    600 |         if (loadedMod != nullptr)
    601 |         {
    602 |             result->mMods.push_back(loadedMod);
    603 |             result->mDataPackageBundle.packages.push_back(package);
    604 |         }
    605 |     }
    606 | 
    607 |     return result;
    608 | }
    609 | std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
    610 | {
    611 |     std::shared_ptr<MountedRemoteModCollectionImpl> result(new MountedRemoteModCollectionImpl);
    612 | 
    613 |     for (int iPackage = static_cast<int>(mDataPackageBundle.packages.size()) - 1; iPackage >= 0; --iPackage)
```

### .\engine\crom\mod_util.cpp:597
- Signature: L593: std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
```cpp
    577 |             estimated_size += entry.fileSize + entry.fileName.length() + 1;
    578 |             if (entry.fileSize)
    579 |             {
    580 |                 ZU_ASSERT_BREAK(entry.fileBytes.size() > 0);
    581 |             }
    582 |             package.entries.push_back(std::move(entry));
    583 |         }
    584 | 
    585 |         result->mEstimatedSize = estimated_size;
    586 | 
    587 |         result->mDataPackageBundle.packages.push_back(std::move(package));
    588 |     }
    589 | 
    590 |     return result;
    591 | }
    592 | 
    593 | std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
    594 | {
    595 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    596 | 
>   597 |     for (auto const & package : bundle.packages)
    598 |     {
    599 |         auto loadedMod = LoadedRemoteModCollectionImpl::loadRemoteMod(package, expected_context);
    600 |         if (loadedMod != nullptr)
    601 |         {
    602 |             result->mMods.push_back(loadedMod);
    603 |             result->mDataPackageBundle.packages.push_back(package);
    604 |         }
    605 |     }
    606 | 
    607 |     return result;
    608 | }
    609 | std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
    610 | {
    611 |     std::shared_ptr<MountedRemoteModCollectionImpl> result(new MountedRemoteModCollectionImpl);
    612 | 
    613 |     for (int iPackage = static_cast<int>(mDataPackageBundle.packages.size()) - 1; iPackage >= 0; --iPackage)
    614 |     {
    615 |         auto const & package = mDataPackageBundle.packages[iPackage];
    616 | 
    617 |         for (auto const & entry : package.entries)
```

### .\engine\crom\mod_util.cpp:603
- Signature: L593: std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
```cpp
    583 |         }
    584 | 
    585 |         result->mEstimatedSize = estimated_size;
    586 | 
    587 |         result->mDataPackageBundle.packages.push_back(std::move(package));
    588 |     }
    589 | 
    590 |     return result;
    591 | }
    592 | 
    593 | std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
    594 | {
    595 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    596 | 
    597 |     for (auto const & package : bundle.packages)
    598 |     {
    599 |         auto loadedMod = LoadedRemoteModCollectionImpl::loadRemoteMod(package, expected_context);
    600 |         if (loadedMod != nullptr)
    601 |         {
    602 |             result->mMods.push_back(loadedMod);
>   603 |             result->mDataPackageBundle.packages.push_back(package);
    604 |         }
    605 |     }
    606 | 
    607 |     return result;
    608 | }
    609 | std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
    610 | {
    611 |     std::shared_ptr<MountedRemoteModCollectionImpl> result(new MountedRemoteModCollectionImpl);
    612 | 
    613 |     for (int iPackage = static_cast<int>(mDataPackageBundle.packages.size()) - 1; iPackage >= 0; --iPackage)
    614 |     {
    615 |         auto const & package = mDataPackageBundle.packages[iPackage];
    616 | 
    617 |         for (auto const & entry : package.entries)
    618 |         {
    619 |             if (entry.isSuppress)
    620 |                 mfs->mountMemoryFileAsSuppress(entry.fileName);
    621 |             else
    622 |             {
    623 |                 size_t size = entry.fileSize;
```

### .\engine\crom\mod_util.cpp:613
- Signature: L609: std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
```cpp
    593 | std::shared_ptr<LoadedRemoteModCollection> LoadedRemoteModCollection::loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context)
    594 | {
    595 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    596 | 
    597 |     for (auto const & package : bundle.packages)
    598 |     {
    599 |         auto loadedMod = LoadedRemoteModCollectionImpl::loadRemoteMod(package, expected_context);
    600 |         if (loadedMod != nullptr)
    601 |         {
    602 |             result->mMods.push_back(loadedMod);
    603 |             result->mDataPackageBundle.packages.push_back(package);
    604 |         }
    605 |     }
    606 | 
    607 |     return result;
    608 | }
    609 | std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
    610 | {
    611 |     std::shared_ptr<MountedRemoteModCollectionImpl> result(new MountedRemoteModCollectionImpl);
    612 | 
>   613 |     for (int iPackage = static_cast<int>(mDataPackageBundle.packages.size()) - 1; iPackage >= 0; --iPackage)
    614 |     {
    615 |         auto const & package = mDataPackageBundle.packages[iPackage];
    616 | 
    617 |         for (auto const & entry : package.entries)
    618 |         {
    619 |             if (entry.isSuppress)
    620 |                 mfs->mountMemoryFileAsSuppress(entry.fileName);
    621 |             else
    622 |             {
    623 |                 size_t size = entry.fileSize;
    624 | 
    625 |                 uint8_t * fileBytes = reinterpret_cast<uint8_t *>(ZU_MALLOC(size));
    626 | 
    627 |                 if (fileBytes == nullptr)
    628 |                     throw std::bad_alloc();
    629 | 
    630 |                 if (entry.isCompressed)
    631 |                 {
    632 |                     int result_ = (int)LZ4_decompress_safe(reinterpret_cast<const char *>(entry.fileBytes.data()), reinterpret_cast<char *>(fileBytes), (int)entry.fileBytes.size(), (int)size);
    633 | 
```

### .\engine\crom\mod_util.cpp:615
- Signature: L609: std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
```cpp
    595 |     std::shared_ptr<LoadedRemoteModCollectionImpl> result(new LoadedRemoteModCollectionImpl);
    596 | 
    597 |     for (auto const & package : bundle.packages)
    598 |     {
    599 |         auto loadedMod = LoadedRemoteModCollectionImpl::loadRemoteMod(package, expected_context);
    600 |         if (loadedMod != nullptr)
    601 |         {
    602 |             result->mMods.push_back(loadedMod);
    603 |             result->mDataPackageBundle.packages.push_back(package);
    604 |         }
    605 |     }
    606 | 
    607 |     return result;
    608 | }
    609 | std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
    610 | {
    611 |     std::shared_ptr<MountedRemoteModCollectionImpl> result(new MountedRemoteModCollectionImpl);
    612 | 
    613 |     for (int iPackage = static_cast<int>(mDataPackageBundle.packages.size()) - 1; iPackage >= 0; --iPackage)
    614 |     {
>   615 |         auto const & package = mDataPackageBundle.packages[iPackage];
    616 | 
    617 |         for (auto const & entry : package.entries)
    618 |         {
    619 |             if (entry.isSuppress)
    620 |                 mfs->mountMemoryFileAsSuppress(entry.fileName);
    621 |             else
    622 |             {
    623 |                 size_t size = entry.fileSize;
    624 | 
    625 |                 uint8_t * fileBytes = reinterpret_cast<uint8_t *>(ZU_MALLOC(size));
    626 | 
    627 |                 if (fileBytes == nullptr)
    628 |                     throw std::bad_alloc();
    629 | 
    630 |                 if (entry.isCompressed)
    631 |                 {
    632 |                     int result_ = (int)LZ4_decompress_safe(reinterpret_cast<const char *>(entry.fileBytes.data()), reinterpret_cast<char *>(fileBytes), (int)entry.fileBytes.size(), (int)size);
    633 | 
    634 |                     if (result_ < 0)
    635 |                     {
```

### .\engine\crom\mod_util.cpp:630
- Signature: L609: std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
```cpp
    610 | {
    611 |     std::shared_ptr<MountedRemoteModCollectionImpl> result(new MountedRemoteModCollectionImpl);
    612 | 
    613 |     for (int iPackage = static_cast<int>(mDataPackageBundle.packages.size()) - 1; iPackage >= 0; --iPackage)
    614 |     {
    615 |         auto const & package = mDataPackageBundle.packages[iPackage];
    616 | 
    617 |         for (auto const & entry : package.entries)
    618 |         {
    619 |             if (entry.isSuppress)
    620 |                 mfs->mountMemoryFileAsSuppress(entry.fileName);
    621 |             else
    622 |             {
    623 |                 size_t size = entry.fileSize;
    624 | 
    625 |                 uint8_t * fileBytes = reinterpret_cast<uint8_t *>(ZU_MALLOC(size));
    626 | 
    627 |                 if (fileBytes == nullptr)
    628 |                     throw std::bad_alloc();
    629 | 
>   630 |                 if (entry.isCompressed)
    631 |                 {
    632 |                     int result_ = (int)LZ4_decompress_safe(reinterpret_cast<const char *>(entry.fileBytes.data()), reinterpret_cast<char *>(fileBytes), (int)entry.fileBytes.size(), (int)size);
    633 | 
    634 |                     if (result_ < 0)
    635 |                     {
    636 |                         ZU_Error << "LZ4_decompress_safe failed for " << entry.fileName;
    637 |                         ZU_FREE(fileBytes);
    638 |                         fileBytes = nullptr;
    639 |                     }
    640 |                 }
    641 |                 else
    642 |                 {
    643 |                     if (entry.fileBytes.size())
    644 |                     {
    645 |                         memcpy(fileBytes, entry.fileBytes.data(), size);
    646 |                     }else
    647 |                     {
    648 |                         memset(fileBytes, 0, size);
    649 |                     }
    650 |                     
```

### .\engine\crom\mod_util.cpp:632
- Signature: L609: std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
```cpp
    612 | 
    613 |     for (int iPackage = static_cast<int>(mDataPackageBundle.packages.size()) - 1; iPackage >= 0; --iPackage)
    614 |     {
    615 |         auto const & package = mDataPackageBundle.packages[iPackage];
    616 | 
    617 |         for (auto const & entry : package.entries)
    618 |         {
    619 |             if (entry.isSuppress)
    620 |                 mfs->mountMemoryFileAsSuppress(entry.fileName);
    621 |             else
    622 |             {
    623 |                 size_t size = entry.fileSize;
    624 | 
    625 |                 uint8_t * fileBytes = reinterpret_cast<uint8_t *>(ZU_MALLOC(size));
    626 | 
    627 |                 if (fileBytes == nullptr)
    628 |                     throw std::bad_alloc();
    629 | 
    630 |                 if (entry.isCompressed)
    631 |                 {
>   632 |                     int result_ = (int)LZ4_decompress_safe(reinterpret_cast<const char *>(entry.fileBytes.data()), reinterpret_cast<char *>(fileBytes), (int)entry.fileBytes.size(), (int)size);
    633 | 
    634 |                     if (result_ < 0)
    635 |                     {
    636 |                         ZU_Error << "LZ4_decompress_safe failed for " << entry.fileName;
    637 |                         ZU_FREE(fileBytes);
    638 |                         fileBytes = nullptr;
    639 |                     }
    640 |                 }
    641 |                 else
    642 |                 {
    643 |                     if (entry.fileBytes.size())
    644 |                     {
    645 |                         memcpy(fileBytes, entry.fileBytes.data(), size);
    646 |                     }else
    647 |                     {
    648 |                         memset(fileBytes, 0, size);
    649 |                     }
    650 |                     
    651 |                 }
    652 | 
```

### .\engine\crom\mod_util.cpp:636
- Signature: L609: std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
```cpp
    616 | 
    617 |         for (auto const & entry : package.entries)
    618 |         {
    619 |             if (entry.isSuppress)
    620 |                 mfs->mountMemoryFileAsSuppress(entry.fileName);
    621 |             else
    622 |             {
    623 |                 size_t size = entry.fileSize;
    624 | 
    625 |                 uint8_t * fileBytes = reinterpret_cast<uint8_t *>(ZU_MALLOC(size));
    626 | 
    627 |                 if (fileBytes == nullptr)
    628 |                     throw std::bad_alloc();
    629 | 
    630 |                 if (entry.isCompressed)
    631 |                 {
    632 |                     int result_ = (int)LZ4_decompress_safe(reinterpret_cast<const char *>(entry.fileBytes.data()), reinterpret_cast<char *>(fileBytes), (int)entry.fileBytes.size(), (int)size);
    633 | 
    634 |                     if (result_ < 0)
    635 |                     {
>   636 |                         ZU_Error << "LZ4_decompress_safe failed for " << entry.fileName;
    637 |                         ZU_FREE(fileBytes);
    638 |                         fileBytes = nullptr;
    639 |                     }
    640 |                 }
    641 |                 else
    642 |                 {
    643 |                     if (entry.fileBytes.size())
    644 |                     {
    645 |                         memcpy(fileBytes, entry.fileBytes.data(), size);
    646 |                     }else
    647 |                     {
    648 |                         memset(fileBytes, 0, size);
    649 |                     }
    650 |                     
    651 |                 }
    652 | 
    653 |                 mfs->mountMemoryFile(entry.fileName, fileBytes, entry.fileSize);
    654 | 
    655 |                 if (fileBytes)
    656 |                 {
```

### .\engine\crom\mod_util.cpp:672
- Signature: L609: std::shared_ptr<MountedRemoteModCollection> LoadedRemoteModCollectionImpl::mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs)
```cpp
    652 | 
    653 |                 mfs->mountMemoryFile(entry.fileName, fileBytes, entry.fileSize);
    654 | 
    655 |                 if (fileBytes)
    656 |                 {
    657 |                     ZU_FREE(fileBytes);
    658 |                     fileBytes = nullptr;
    659 |                 }
    660 |             }
    661 |             // Override any aliases for this file.
    662 | 
    663 | #ifdef COMMON_FILESYSTEM
    664 |             mfs->alias(entry.fileName, entry.fileName, true);
    665 | #else
    666 |             mfs->alias(entry.fileName, entry.fileName);
    667 | #endif
    668 |         }
    669 |     }
    670 | 
    671 |     result->mMods = mMods;
>   672 |     result->mDataPackageBundle = mDataPackageBundle;
    673 |     result->mMemoryFilesystem = mfs;
    674 |     result->mMounted = true;
    675 | 
    676 |     return result;
    677 | }
    678 | std::shared_ptr<ModInfo> LoadedRemoteModCollectionImpl::loadRemoteMod(ModFileDataPackage const & package, zu::StringRange expected_context)
    679 | {
    680 |     auto result = std::shared_ptr<ModInfo>(new ModInfo);
    681 | 
    682 |     auto configFileName = "/modinfo.json";
    683 |     for (auto & entry : package.entries)
    684 |     {
    685 |         if (!string_equals_nocase(entry.fileName, configFileName))
    686 |             continue;
    687 | 
    688 |         // found the mod info
    689 | 
    690 |         if (!entry.fileBytes.empty())
    691 |         {
    692 | 
```

### .\engine\crom\mod_util.cpp:695
- Signature: L678: std::shared_ptr<ModInfo> LoadedRemoteModCollectionImpl::loadRemoteMod(ModFileDataPackage const & package, zu::StringRange expected_context)
```cpp
    675 | 
    676 |     return result;
    677 | }
    678 | std::shared_ptr<ModInfo> LoadedRemoteModCollectionImpl::loadRemoteMod(ModFileDataPackage const & package, zu::StringRange expected_context)
    679 | {
    680 |     auto result = std::shared_ptr<ModInfo>(new ModInfo);
    681 | 
    682 |     auto configFileName = "/modinfo.json";
    683 |     for (auto & entry : package.entries)
    684 |     {
    685 |         if (!string_equals_nocase(entry.fileName, configFileName))
    686 |             continue;
    687 | 
    688 |         // found the mod info
    689 | 
    690 |         if (!entry.fileBytes.empty())
    691 |         {
    692 | 
    693 |             std::vector<uint8_t> fileBytes;
    694 | 
>   695 |             if (entry.isCompressed)
    696 |             {
    697 |                 fileBytes.resize(entry.fileSize);
    698 | 
    699 |                 int result_ = (int)LZ4_decompress_safe(reinterpret_cast<const char *>(&entry.fileBytes[0]), reinterpret_cast<char *>(&fileBytes[0]), (int)entry.fileBytes.size(), entry.fileSize);
    700 | 
    701 |                 if ( result_ < 0 )
    702 |                 {
    703 |                     ZU_Error << "LZ4_decompress_safe failed for " << entry.fileName;
    704 |                     fileBytes.clear();
    705 |                 }
    706 |             }
    707 |             else
    708 |             {
    709 |                 fileBytes = entry.fileBytes;
    710 |             }
    711 | 
    712 |             MemoryStream memory_stream(const_cast<uint8_t*>(&fileBytes[0]), fileBytes.size());
    713 | 
    714 |             auto json = Json::readFrom(memory_stream);
    715 |             if (!json.isObject())
```

### .\engine\crom\mod_util.cpp:699
- Signature: L678: std::shared_ptr<ModInfo> LoadedRemoteModCollectionImpl::loadRemoteMod(ModFileDataPackage const & package, zu::StringRange expected_context)
```cpp
    679 | {
    680 |     auto result = std::shared_ptr<ModInfo>(new ModInfo);
    681 | 
    682 |     auto configFileName = "/modinfo.json";
    683 |     for (auto & entry : package.entries)
    684 |     {
    685 |         if (!string_equals_nocase(entry.fileName, configFileName))
    686 |             continue;
    687 | 
    688 |         // found the mod info
    689 | 
    690 |         if (!entry.fileBytes.empty())
    691 |         {
    692 | 
    693 |             std::vector<uint8_t> fileBytes;
    694 | 
    695 |             if (entry.isCompressed)
    696 |             {
    697 |                 fileBytes.resize(entry.fileSize);
    698 | 
>   699 |                 int result_ = (int)LZ4_decompress_safe(reinterpret_cast<const char *>(&entry.fileBytes[0]), reinterpret_cast<char *>(&fileBytes[0]), (int)entry.fileBytes.size(), entry.fileSize);
    700 | 
    701 |                 if ( result_ < 0 )
    702 |                 {
    703 |                     ZU_Error << "LZ4_decompress_safe failed for " << entry.fileName;
    704 |                     fileBytes.clear();
    705 |                 }
    706 |             }
    707 |             else
    708 |             {
    709 |                 fileBytes = entry.fileBytes;
    710 |             }
    711 | 
    712 |             MemoryStream memory_stream(const_cast<uint8_t*>(&fileBytes[0]), fileBytes.size());
    713 | 
    714 |             auto json = Json::readFrom(memory_stream);
    715 |             if (!json.isObject())
    716 |             {
    717 |                 ZU_Error << "   : mod config requires a valid json object at the root";
    718 |                 return nullptr;
    719 |             }
```

### .\engine\crom\mod_util.cpp:703
- Signature: L678: std::shared_ptr<ModInfo> LoadedRemoteModCollectionImpl::loadRemoteMod(ModFileDataPackage const & package, zu::StringRange expected_context)
```cpp
    683 |     for (auto & entry : package.entries)
    684 |     {
    685 |         if (!string_equals_nocase(entry.fileName, configFileName))
    686 |             continue;
    687 | 
    688 |         // found the mod info
    689 | 
    690 |         if (!entry.fileBytes.empty())
    691 |         {
    692 | 
    693 |             std::vector<uint8_t> fileBytes;
    694 | 
    695 |             if (entry.isCompressed)
    696 |             {
    697 |                 fileBytes.resize(entry.fileSize);
    698 | 
    699 |                 int result_ = (int)LZ4_decompress_safe(reinterpret_cast<const char *>(&entry.fileBytes[0]), reinterpret_cast<char *>(&fileBytes[0]), (int)entry.fileBytes.size(), entry.fileSize);
    700 | 
    701 |                 if ( result_ < 0 )
    702 |                 {
>   703 |                     ZU_Error << "LZ4_decompress_safe failed for " << entry.fileName;
    704 |                     fileBytes.clear();
    705 |                 }
    706 |             }
    707 |             else
    708 |             {
    709 |                 fileBytes = entry.fileBytes;
    710 |             }
    711 | 
    712 |             MemoryStream memory_stream(const_cast<uint8_t*>(&fileBytes[0]), fileBytes.size());
    713 | 
    714 |             auto json = Json::readFrom(memory_stream);
    715 |             if (!json.isObject())
    716 |             {
    717 |                 ZU_Error << "   : mod config requires a valid json object at the root";
    718 |                 return nullptr;
    719 |             }
    720 | 
    721 |             if (!parseModInfoJson(json, result))
    722 |                 return nullptr;
    723 | 
```

### .\engine\crom\mod_util.h:19
- Signature: Not found within 120 lines above match
```cpp
      1 | #ifndef CROM_MOD_UTIL_H
      2 | #define CROM_MOD_UTIL_H
      3 | 
      4 | #include <engine/zu/config.h>
      5 | #include <engine/zu/counted.h>
      6 | #include <engine/zu/strutil.h>
      7 | #include <engine/zu/json.h>
      8 | 
      9 | #include <memory>
     10 | #include <string>
     11 | #include <vector>
     12 | 
     13 | namespace crom
     14 | {
     15 |     class Filesystem;
     16 |     class MemoryFilesystem;
     17 | }
     18 | 
>    19 | struct ModFileDataPackageBundle;
     20 | 
     21 | namespace modutil
     22 | {
     23 |     class ModCollection;
     24 |     class LocalModCollection;
     25 |     class RemoteModCollection;
     26 |     class LoadedLocalModCollection;
     27 |     class LoadedRemoteModCollection;
     28 |     class MountedLocalModCollection;
     29 |     class MountedRemoteModCollection;
     30 | 
     31 |     struct ModInfo
     32 |     {
     33 |         std::string identifier; // reverse-domain-name format name, e.g. com.myawesomepamodsite.badassmods.baconcommander
     34 |         std::string context_string; // "client" or "server"
     35 |         std::vector<std::string> dependencies; // mod identifiers this mod depends on; used to verify mount order
     36 | 
     37 |         // no internal dependency on these fields; intended for community use
     38 |         std::string display_name;
     39 |         std::string author;
```

### .\engine\crom\mod_util.h:78
- Signature: L63:         virtual ~ModCollection() {}
```cpp
     58 | 
     59 |     // ModCollection - base mod collection, simply a container of mod infos
     60 |     class ModCollection
     61 |     {
     62 |     public:
     63 |         virtual ~ModCollection() {}
     64 | 
     65 |         virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const = 0;
     66 |         virtual zu::Json getModsJsonArray() const = 0;
     67 |     };
     68 | 
     69 |     // LocalModCollection - intermediate base for mods which are backed by local files on disk
     70 |     class LocalModCollection
     71 |         : public ModCollection
     72 |     {
     73 |     public:
     74 |         // base directory system paths that the mod collection was built from
     75 |         virtual std::vector<std::string> const & getModBaseDirSystemPaths() const = 0;
     76 |     };
     77 | 
>    78 |     // RemoteModCollection - intermediate base for mods which are backed by a data package bundle in memory
     79 |     class RemoteModCollection
     80 |         : public ModCollection
     81 |     {
     82 |     public:
     83 |         // data package bundle containing the underlying mod file data
     84 |         virtual ModFileDataPackageBundle const & getDataPackageBundle() const = 0;
     85 |         virtual size_t const & getEstimatedSize() const = 0;
     86 |     };
     87 | 
     88 |     // LoadedLocalModCollection - a local mod collection with a configurable mount order; can create a mounted
     89 |     //   mod collection by mounting on to a file system, or generate a remote mod collection with the same mount order.
     90 |     class LoadedLocalModCollection
     91 |         : public LocalModCollection
     92 |     {
     93 |     public:
     94 |         // load a mod collection from the given base directories, and the given info file (which optionally determines settings like mount order).
     95 |         //   Note that the base directories and info file are system paths, and are independent (the info file path does not assume any given base dir is a prefix).
     96 |         static std::shared_ptr<LoadedLocalModCollection> loadLocalModCollection(zu::RefNoCount<crom::Filesystem> fs, std::vector<std::string> const & mod_base_dir_paths, zu::StringRange info_file_path, zu::StringRange expected_context);
     97 | 
     98 |         // get/set the mount order, which are integer indices into the mod array (initial settings come from the info file)
```

### .\engine\crom\mod_util.h:83
- Signature: L63:         virtual ~ModCollection() {}
```cpp
     63 |         virtual ~ModCollection() {}
     64 | 
     65 |         virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const = 0;
     66 |         virtual zu::Json getModsJsonArray() const = 0;
     67 |     };
     68 | 
     69 |     // LocalModCollection - intermediate base for mods which are backed by local files on disk
     70 |     class LocalModCollection
     71 |         : public ModCollection
     72 |     {
     73 |     public:
     74 |         // base directory system paths that the mod collection was built from
     75 |         virtual std::vector<std::string> const & getModBaseDirSystemPaths() const = 0;
     76 |     };
     77 | 
     78 |     // RemoteModCollection - intermediate base for mods which are backed by a data package bundle in memory
     79 |     class RemoteModCollection
     80 |         : public ModCollection
     81 |     {
     82 |     public:
>    83 |         // data package bundle containing the underlying mod file data
     84 |         virtual ModFileDataPackageBundle const & getDataPackageBundle() const = 0;
     85 |         virtual size_t const & getEstimatedSize() const = 0;
     86 |     };
     87 | 
     88 |     // LoadedLocalModCollection - a local mod collection with a configurable mount order; can create a mounted
     89 |     //   mod collection by mounting on to a file system, or generate a remote mod collection with the same mount order.
     90 |     class LoadedLocalModCollection
     91 |         : public LocalModCollection
     92 |     {
     93 |     public:
     94 |         // load a mod collection from the given base directories, and the given info file (which optionally determines settings like mount order).
     95 |         //   Note that the base directories and info file are system paths, and are independent (the info file path does not assume any given base dir is a prefix).
     96 |         static std::shared_ptr<LoadedLocalModCollection> loadLocalModCollection(zu::RefNoCount<crom::Filesystem> fs, std::vector<std::string> const & mod_base_dir_paths, zu::StringRange info_file_path, zu::StringRange expected_context);
     97 | 
     98 |         // get/set the mount order, which are integer indices into the mod array (initial settings come from the info file)
     99 |         virtual std::vector<size_t> getMountOrder() const = 0;
    100 |         virtual void setMountOrder(std::vector<size_t> const & mount_order) = 0;
    101 | 
    102 |         // mount the mod collection to the given file system, using the current mount order settings
    103 |         virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) = 0;
```

### .\engine\crom\mod_util.h:84
- Signature: L63:         virtual ~ModCollection() {}
```cpp
     64 | 
     65 |         virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const = 0;
     66 |         virtual zu::Json getModsJsonArray() const = 0;
     67 |     };
     68 | 
     69 |     // LocalModCollection - intermediate base for mods which are backed by local files on disk
     70 |     class LocalModCollection
     71 |         : public ModCollection
     72 |     {
     73 |     public:
     74 |         // base directory system paths that the mod collection was built from
     75 |         virtual std::vector<std::string> const & getModBaseDirSystemPaths() const = 0;
     76 |     };
     77 | 
     78 |     // RemoteModCollection - intermediate base for mods which are backed by a data package bundle in memory
     79 |     class RemoteModCollection
     80 |         : public ModCollection
     81 |     {
     82 |     public:
     83 |         // data package bundle containing the underlying mod file data
>    84 |         virtual ModFileDataPackageBundle const & getDataPackageBundle() const = 0;
     85 |         virtual size_t const & getEstimatedSize() const = 0;
     86 |     };
     87 | 
     88 |     // LoadedLocalModCollection - a local mod collection with a configurable mount order; can create a mounted
     89 |     //   mod collection by mounting on to a file system, or generate a remote mod collection with the same mount order.
     90 |     class LoadedLocalModCollection
     91 |         : public LocalModCollection
     92 |     {
     93 |     public:
     94 |         // load a mod collection from the given base directories, and the given info file (which optionally determines settings like mount order).
     95 |         //   Note that the base directories and info file are system paths, and are independent (the info file path does not assume any given base dir is a prefix).
     96 |         static std::shared_ptr<LoadedLocalModCollection> loadLocalModCollection(zu::RefNoCount<crom::Filesystem> fs, std::vector<std::string> const & mod_base_dir_paths, zu::StringRange info_file_path, zu::StringRange expected_context);
     97 | 
     98 |         // get/set the mount order, which are integer indices into the mod array (initial settings come from the info file)
     99 |         virtual std::vector<size_t> getMountOrder() const = 0;
    100 |         virtual void setMountOrder(std::vector<size_t> const & mount_order) = 0;
    101 | 
    102 |         // mount the mod collection to the given file system, using the current mount order settings
    103 |         virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) = 0;
    104 | 
```

### .\engine\crom\mod_util.h:85
- Signature: L63:         virtual ~ModCollection() {}
```cpp
     65 |         virtual std::vector<std::shared_ptr<ModInfo>> const & getMods() const = 0;
     66 |         virtual zu::Json getModsJsonArray() const = 0;
     67 |     };
     68 | 
     69 |     // LocalModCollection - intermediate base for mods which are backed by local files on disk
     70 |     class LocalModCollection
     71 |         : public ModCollection
     72 |     {
     73 |     public:
     74 |         // base directory system paths that the mod collection was built from
     75 |         virtual std::vector<std::string> const & getModBaseDirSystemPaths() const = 0;
     76 |     };
     77 | 
     78 |     // RemoteModCollection - intermediate base for mods which are backed by a data package bundle in memory
     79 |     class RemoteModCollection
     80 |         : public ModCollection
     81 |     {
     82 |     public:
     83 |         // data package bundle containing the underlying mod file data
     84 |         virtual ModFileDataPackageBundle const & getDataPackageBundle() const = 0;
>    85 |         virtual size_t const & getEstimatedSize() const = 0;
     86 |     };
     87 | 
     88 |     // LoadedLocalModCollection - a local mod collection with a configurable mount order; can create a mounted
     89 |     //   mod collection by mounting on to a file system, or generate a remote mod collection with the same mount order.
     90 |     class LoadedLocalModCollection
     91 |         : public LocalModCollection
     92 |     {
     93 |     public:
     94 |         // load a mod collection from the given base directories, and the given info file (which optionally determines settings like mount order).
     95 |         //   Note that the base directories and info file are system paths, and are independent (the info file path does not assume any given base dir is a prefix).
     96 |         static std::shared_ptr<LoadedLocalModCollection> loadLocalModCollection(zu::RefNoCount<crom::Filesystem> fs, std::vector<std::string> const & mod_base_dir_paths, zu::StringRange info_file_path, zu::StringRange expected_context);
     97 | 
     98 |         // get/set the mount order, which are integer indices into the mod array (initial settings come from the info file)
     99 |         virtual std::vector<size_t> getMountOrder() const = 0;
    100 |         virtual void setMountOrder(std::vector<size_t> const & mount_order) = 0;
    101 | 
    102 |         // mount the mod collection to the given file system, using the current mount order settings
    103 |         virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) = 0;
    104 | 
    105 |         // generate a remote mod collection using the current mount order settings.  Note that remote mod collections support suppression
```

### .\engine\crom\mod_util.h:108
- Signature: L63:         virtual ~ModCollection() {}
```cpp
     88 |     // LoadedLocalModCollection - a local mod collection with a configurable mount order; can create a mounted
     89 |     //   mod collection by mounting on to a file system, or generate a remote mod collection with the same mount order.
     90 |     class LoadedLocalModCollection
     91 |         : public LocalModCollection
     92 |     {
     93 |     public:
     94 |         // load a mod collection from the given base directories, and the given info file (which optionally determines settings like mount order).
     95 |         //   Note that the base directories and info file are system paths, and are independent (the info file path does not assume any given base dir is a prefix).
     96 |         static std::shared_ptr<LoadedLocalModCollection> loadLocalModCollection(zu::RefNoCount<crom::Filesystem> fs, std::vector<std::string> const & mod_base_dir_paths, zu::StringRange info_file_path, zu::StringRange expected_context);
     97 | 
     98 |         // get/set the mount order, which are integer indices into the mod array (initial settings come from the info file)
     99 |         virtual std::vector<size_t> getMountOrder() const = 0;
    100 |         virtual void setMountOrder(std::vector<size_t> const & mount_order) = 0;
    101 | 
    102 |         // mount the mod collection to the given file system, using the current mount order settings
    103 |         virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) = 0;
    104 | 
    105 |         // generate a remote mod collection using the current mount order settings.  Note that remote mod collections support suppression
    106 |         //   of existing files (a feature of the underlying mod file data); if you wish to have a local file treated as a suppression, create the file
    107 |         //   as usual (even if it's empty) and then add an additional extension ".hide", e.g. "/pa/foo/bar.html.hide" will suppress "/pa/foo/bar.html".
>   108 |         virtual std::shared_ptr<LoadedRemoteModCollection> makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compress) = 0;
    109 |     };
    110 | 
    111 |     // LoadedRemoteModCollection - a remote mod collection which can create a mounted mod collection by mounting on to
    112 |     //   a memory file system.  The mount order for remote mod collections is implied in the data package bundle and cannot be changed.
    113 |     class LoadedRemoteModCollection
    114 |         : public RemoteModCollection
    115 |     {
    116 |     public:
    117 |         // load a mod collection from the given data package bundle
    118 |         static std::shared_ptr<LoadedRemoteModCollection> loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context);
    119 | 
    120 |         // mount the mod collection to the given memory file system
    121 |         virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) = 0;
    122 |     };
    123 | 
    124 |     // MountedLocalModCollection - a mod collection backed by local files and mounted on to a file system.
    125 |     //   The mount lasts for the scope of this collection; deleting the collection will release the mount
    126 |     //
    127 |     // ###chargrove $TODO: TECHNICAL DEBT / LIMITATION: at the moment only one mounted local mod collection
    128 |     //   can be created for the lifetime of the given file system, since there is currently no unmounting mechanism
```

### .\engine\crom\mod_util.h:112
- Signature: L63:         virtual ~ModCollection() {}
```cpp
     92 |     {
     93 |     public:
     94 |         // load a mod collection from the given base directories, and the given info file (which optionally determines settings like mount order).
     95 |         //   Note that the base directories and info file are system paths, and are independent (the info file path does not assume any given base dir is a prefix).
     96 |         static std::shared_ptr<LoadedLocalModCollection> loadLocalModCollection(zu::RefNoCount<crom::Filesystem> fs, std::vector<std::string> const & mod_base_dir_paths, zu::StringRange info_file_path, zu::StringRange expected_context);
     97 | 
     98 |         // get/set the mount order, which are integer indices into the mod array (initial settings come from the info file)
     99 |         virtual std::vector<size_t> getMountOrder() const = 0;
    100 |         virtual void setMountOrder(std::vector<size_t> const & mount_order) = 0;
    101 | 
    102 |         // mount the mod collection to the given file system, using the current mount order settings
    103 |         virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) = 0;
    104 | 
    105 |         // generate a remote mod collection using the current mount order settings.  Note that remote mod collections support suppression
    106 |         //   of existing files (a feature of the underlying mod file data); if you wish to have a local file treated as a suppression, create the file
    107 |         //   as usual (even if it's empty) and then add an additional extension ".hide", e.g. "/pa/foo/bar.html.hide" will suppress "/pa/foo/bar.html".
    108 |         virtual std::shared_ptr<LoadedRemoteModCollection> makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compress) = 0;
    109 |     };
    110 | 
    111 |     // LoadedRemoteModCollection - a remote mod collection which can create a mounted mod collection by mounting on to
>   112 |     //   a memory file system.  The mount order for remote mod collections is implied in the data package bundle and cannot be changed.
    113 |     class LoadedRemoteModCollection
    114 |         : public RemoteModCollection
    115 |     {
    116 |     public:
    117 |         // load a mod collection from the given data package bundle
    118 |         static std::shared_ptr<LoadedRemoteModCollection> loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context);
    119 | 
    120 |         // mount the mod collection to the given memory file system
    121 |         virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) = 0;
    122 |     };
    123 | 
    124 |     // MountedLocalModCollection - a mod collection backed by local files and mounted on to a file system.
    125 |     //   The mount lasts for the scope of this collection; deleting the collection will release the mount
    126 |     //
    127 |     // ###chargrove $TODO: TECHNICAL DEBT / LIMITATION: at the moment only one mounted local mod collection
    128 |     //   can be created for the lifetime of the given file system, since there is currently no unmounting mechanism
    129 |     //
    130 |     class MountedLocalModCollection
    131 |         : public LocalModCollection
    132 |     {
```

### .\engine\crom\mod_util.h:117
- Signature: L63:         virtual ~ModCollection() {}
```cpp
     97 | 
     98 |         // get/set the mount order, which are integer indices into the mod array (initial settings come from the info file)
     99 |         virtual std::vector<size_t> getMountOrder() const = 0;
    100 |         virtual void setMountOrder(std::vector<size_t> const & mount_order) = 0;
    101 | 
    102 |         // mount the mod collection to the given file system, using the current mount order settings
    103 |         virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) = 0;
    104 | 
    105 |         // generate a remote mod collection using the current mount order settings.  Note that remote mod collections support suppression
    106 |         //   of existing files (a feature of the underlying mod file data); if you wish to have a local file treated as a suppression, create the file
    107 |         //   as usual (even if it's empty) and then add an additional extension ".hide", e.g. "/pa/foo/bar.html.hide" will suppress "/pa/foo/bar.html".
    108 |         virtual std::shared_ptr<LoadedRemoteModCollection> makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compress) = 0;
    109 |     };
    110 | 
    111 |     // LoadedRemoteModCollection - a remote mod collection which can create a mounted mod collection by mounting on to
    112 |     //   a memory file system.  The mount order for remote mod collections is implied in the data package bundle and cannot be changed.
    113 |     class LoadedRemoteModCollection
    114 |         : public RemoteModCollection
    115 |     {
    116 |     public:
>   117 |         // load a mod collection from the given data package bundle
    118 |         static std::shared_ptr<LoadedRemoteModCollection> loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context);
    119 | 
    120 |         // mount the mod collection to the given memory file system
    121 |         virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) = 0;
    122 |     };
    123 | 
    124 |     // MountedLocalModCollection - a mod collection backed by local files and mounted on to a file system.
    125 |     //   The mount lasts for the scope of this collection; deleting the collection will release the mount
    126 |     //
    127 |     // ###chargrove $TODO: TECHNICAL DEBT / LIMITATION: at the moment only one mounted local mod collection
    128 |     //   can be created for the lifetime of the given file system, since there is currently no unmounting mechanism
    129 |     //
    130 |     class MountedLocalModCollection
    131 |         : public LocalModCollection
    132 |     {
    133 |     public:
    134 |         // get the file system the mod collection is mounted to
    135 |         virtual zu::RefNoCount<crom::Filesystem> getFilesystem() const = 0;
    136 |     };
    137 | 
```

### .\engine\crom\mod_util.h:118
- Signature: L63:         virtual ~ModCollection() {}
```cpp
     98 |         // get/set the mount order, which are integer indices into the mod array (initial settings come from the info file)
     99 |         virtual std::vector<size_t> getMountOrder() const = 0;
    100 |         virtual void setMountOrder(std::vector<size_t> const & mount_order) = 0;
    101 | 
    102 |         // mount the mod collection to the given file system, using the current mount order settings
    103 |         virtual std::shared_ptr<MountedLocalModCollection> mountToFilesystem(zu::RefNoCount<crom::Filesystem> fs) = 0;
    104 | 
    105 |         // generate a remote mod collection using the current mount order settings.  Note that remote mod collections support suppression
    106 |         //   of existing files (a feature of the underlying mod file data); if you wish to have a local file treated as a suppression, create the file
    107 |         //   as usual (even if it's empty) and then add an additional extension ".hide", e.g. "/pa/foo/bar.html.hide" will suppress "/pa/foo/bar.html".
    108 |         virtual std::shared_ptr<LoadedRemoteModCollection> makeRemoteModCollection(zu::RefNoCount<crom::Filesystem> fs, bool compress) = 0;
    109 |     };
    110 | 
    111 |     // LoadedRemoteModCollection - a remote mod collection which can create a mounted mod collection by mounting on to
    112 |     //   a memory file system.  The mount order for remote mod collections is implied in the data package bundle and cannot be changed.
    113 |     class LoadedRemoteModCollection
    114 |         : public RemoteModCollection
    115 |     {
    116 |     public:
    117 |         // load a mod collection from the given data package bundle
>   118 |         static std::shared_ptr<LoadedRemoteModCollection> loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context);
    119 | 
    120 |         // mount the mod collection to the given memory file system
    121 |         virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) = 0;
    122 |     };
    123 | 
    124 |     // MountedLocalModCollection - a mod collection backed by local files and mounted on to a file system.
    125 |     //   The mount lasts for the scope of this collection; deleting the collection will release the mount
    126 |     //
    127 |     // ###chargrove $TODO: TECHNICAL DEBT / LIMITATION: at the moment only one mounted local mod collection
    128 |     //   can be created for the lifetime of the given file system, since there is currently no unmounting mechanism
    129 |     //
    130 |     class MountedLocalModCollection
    131 |         : public LocalModCollection
    132 |     {
    133 |     public:
    134 |         // get the file system the mod collection is mounted to
    135 |         virtual zu::RefNoCount<crom::Filesystem> getFilesystem() const = 0;
    136 |     };
    137 | 
    138 |     // MountedRemoteModCollection - a mod collection backed by a data package bundle and mounted on to
```

### .\engine\crom\mod_util.h:138
- Signature: L63:         virtual ~ModCollection() {}
```cpp
    118 |         static std::shared_ptr<LoadedRemoteModCollection> loadRemoteModCollection(ModFileDataPackageBundle const & bundle, zu::StringRange expected_context);
    119 | 
    120 |         // mount the mod collection to the given memory file system
    121 |         virtual std::shared_ptr<MountedRemoteModCollection> mountToMemoryFilesystem(zu::RefNoCount<crom::MemoryFilesystem> mfs) = 0;
    122 |     };
    123 | 
    124 |     // MountedLocalModCollection - a mod collection backed by local files and mounted on to a file system.
    125 |     //   The mount lasts for the scope of this collection; deleting the collection will release the mount
    126 |     //
    127 |     // ###chargrove $TODO: TECHNICAL DEBT / LIMITATION: at the moment only one mounted local mod collection
    128 |     //   can be created for the lifetime of the given file system, since there is currently no unmounting mechanism
    129 |     //
    130 |     class MountedLocalModCollection
    131 |         : public LocalModCollection
    132 |     {
    133 |     public:
    134 |         // get the file system the mod collection is mounted to
    135 |         virtual zu::RefNoCount<crom::Filesystem> getFilesystem() const = 0;
    136 |     };
    137 | 
>   138 |     // MountedRemoteModCollection - a mod collection backed by a data package bundle and mounted on to
    139 |     //   a memory file system.  The mount lasts for the scope of this collection; deleting the collection
    140 |     //   will release the mount.
    141 |     //
    142 |     // ###chargrove $TODO: TECHNICAL DEBT / LIMITATION: at the moment only one mounted remote mod collection
    143 |     //   can exist at a time for the given memory file system, since unmounting is currently done wholesale.
    144 |     //   Make sure to unmount or delete any existing mounted remote mod collection before creating a new one.
    145 |     //
    146 |     class MountedRemoteModCollection
    147 |         : public RemoteModCollection
    148 |     {
    149 |     public:
    150 |         // get the memory file system the mod collection is mounted to
    151 |         virtual zu::Ref<crom::MemoryFilesystem> getMemoryFilesystem() const = 0;
    152 | 
    153 |         // unmount from the underlying memory file system
    154 |         virtual void unmount() = 0;
    155 |     };
    156 | }
    157 | 
    158 | #endif
```

### .\libs\server\game_server.cpp:198
- Signature: Not found within 120 lines above match
```cpp
    178 |     ConnectionImpl(GameServerImpl * game_server, HistoryServer * history_server, std::string const & debug_descr, RefNoCount<net::Socket> socket);
    179 | #ifdef HAVE_STEAM
    180 |     ConnectionImpl(GameServerImpl * game_server, HistoryServer * history_server, std::string const & debug_descr, net::SteamMsgPipe * steam_pipe);
    181 | #endif
    182 |     ~ConnectionImpl();
    183 | 
    184 |     // Connection interface.
    185 |     virtual std::string const & debugDescription() const override { return debug_descr; }
    186 |     virtual std::string const & playerName() const override { return player_name; }
    187 |     virtual std::string const & playerIdentity() const override { return player_identity; }
    188 |     virtual std::string const & playerData() const override { return player_data; }
    189 |     virtual Ref<net::GSPlayerInfo> ubernetData() const override { return ubernet_player_info; }
    190 | 
    191 |     virtual bool connected() const override;
    192 |     virtual void setCheatsAllowed(bool value) override;
    193 |     virtual void setArmyControlBits(BitVec const & bits) override;
    194 |     virtual void setArmyVisionBits(BitVec const & bits) override;
    195 |     virtual BitVec getArmyVisionBits() const override;
    196 |     virtual void sendMessage(Json const & json) override;
    197 |     virtual void sendMessage(std::string const & message) override;
>   198 |     virtual void sendModFileData(ModFileDataPackageBundle const & bundle, size_t estimated_size) override;
    199 |     virtual void close() override;
    200 | 
    201 |     void reset();
    202 | 
    203 |     void sendUpArmyControlBits(std::unique_lock<std::mutex> & lock) const;
    204 |     void sendUpArmyVisionBits(std::unique_lock<std::mutex> & lock) const;
    205 | };
    206 | 
    207 | 
    208 | class GameServerImpl;
    209 | 
    210 | 
    211 | class SimHandleImpl : public DListItem<SimHandleImpl>
    212 | {
    213 |     GameServerImpl * mServer;
    214 | 
    215 |   public:
    216 | 
    217 |     explicit SimHandleImpl(GameServerImpl * server);
    218 |     virtual ~SimHandleImpl();
```

### .\libs\server\game_server.cpp:555
- Signature: Not found within 120 lines above match
```cpp
    535 |             ::dumpHistory(&mEntityFactory, *mServerHistory, stream);
    536 |         else
    537 |             stream << "No server history!";
    538 |     }
    539 | 
    540 |     virtual void setReplayConfig(Json const & replayConfigSummaryJson, Json const & replayConfigFullJson) override;
    541 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, Json & inOutInfoJson) const override;
    542 |     virtual void setGameConfig(Json const & config) override;
    543 |     virtual Json getGameConfig() override;
    544 |     virtual Json getReplayConfigSummary() override;
    545 |     virtual Json getFullReplayConfig() override;
    546 |     virtual void describeHistoryStats(Json desc) const override;
    547 | 
    548 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, Json & outInfoJson) override;
    549 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, Json & outInfoJson) override;
    550 |     virtual void createSimFromReplay() override;
    551 |     virtual void trimHistoryAndStartSim(float load_time) override;
    552 | 
    553 |     virtual std::string getModUpdateAuthToken() const override;
    554 |     virtual void resetModUpdateAuthToken() override;
>   555 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) override;
    556 |     virtual Json getMountedModsJsonArray() const override;
    557 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const override;
    558 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const override;
    559 | 
    560 |     virtual void toggleNavDebug() override { mDriverHandle->driver->toggleNavDebug(); }
    561 |     virtual void initDropletTest(Vec3f const & position) override { mDriverHandle->driver->initDropletTest(position); }
    562 | 
    563 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) override { mRequiredContent = requiredContent; }
    564 | 
    565 | #ifdef HAVE_STEAM
    566 |     void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) override;
    567 | #endif
    568 | 
    569 |   private:
    570 | 
    571 | #ifdef HAVE_STEAM
    572 |     void pollSteamConnections();
    573 |     void acceptSteamConnection();
    574 | #endif
    575 | 
```

### .\libs\server\game_server.cpp:557
- Signature: Not found within 120 lines above match
```cpp
    537 |             stream << "No server history!";
    538 |     }
    539 | 
    540 |     virtual void setReplayConfig(Json const & replayConfigSummaryJson, Json const & replayConfigFullJson) override;
    541 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, Json & inOutInfoJson) const override;
    542 |     virtual void setGameConfig(Json const & config) override;
    543 |     virtual Json getGameConfig() override;
    544 |     virtual Json getReplayConfigSummary() override;
    545 |     virtual Json getFullReplayConfig() override;
    546 |     virtual void describeHistoryStats(Json desc) const override;
    547 | 
    548 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, Json & outInfoJson) override;
    549 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, Json & outInfoJson) override;
    550 |     virtual void createSimFromReplay() override;
    551 |     virtual void trimHistoryAndStartSim(float load_time) override;
    552 | 
    553 |     virtual std::string getModUpdateAuthToken() const override;
    554 |     virtual void resetModUpdateAuthToken() override;
    555 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) override;
    556 |     virtual Json getMountedModsJsonArray() const override;
>   557 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const override;
    558 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const override;
    559 | 
    560 |     virtual void toggleNavDebug() override { mDriverHandle->driver->toggleNavDebug(); }
    561 |     virtual void initDropletTest(Vec3f const & position) override { mDriverHandle->driver->initDropletTest(position); }
    562 | 
    563 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) override { mRequiredContent = requiredContent; }
    564 | 
    565 | #ifdef HAVE_STEAM
    566 |     void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) override;
    567 | #endif
    568 | 
    569 |   private:
    570 | 
    571 | #ifdef HAVE_STEAM
    572 |     void pollSteamConnections();
    573 |     void acceptSteamConnection();
    574 | #endif
    575 | 
    576 |     std::unique_ptr<WorldHistory> readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson);
    577 | 
```

### .\libs\server\game_server.cpp:558
- Signature: Not found within 120 lines above match
```cpp
    538 |     }
    539 | 
    540 |     virtual void setReplayConfig(Json const & replayConfigSummaryJson, Json const & replayConfigFullJson) override;
    541 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, Json & inOutInfoJson) const override;
    542 |     virtual void setGameConfig(Json const & config) override;
    543 |     virtual Json getGameConfig() override;
    544 |     virtual Json getReplayConfigSummary() override;
    545 |     virtual Json getFullReplayConfig() override;
    546 |     virtual void describeHistoryStats(Json desc) const override;
    547 | 
    548 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, Json & outInfoJson) override;
    549 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, Json & outInfoJson) override;
    550 |     virtual void createSimFromReplay() override;
    551 |     virtual void trimHistoryAndStartSim(float load_time) override;
    552 | 
    553 |     virtual std::string getModUpdateAuthToken() const override;
    554 |     virtual void resetModUpdateAuthToken() override;
    555 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) override;
    556 |     virtual Json getMountedModsJsonArray() const override;
    557 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const override;
>   558 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const override;
    559 | 
    560 |     virtual void toggleNavDebug() override { mDriverHandle->driver->toggleNavDebug(); }
    561 |     virtual void initDropletTest(Vec3f const & position) override { mDriverHandle->driver->initDropletTest(position); }
    562 | 
    563 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) override { mRequiredContent = requiredContent; }
    564 | 
    565 | #ifdef HAVE_STEAM
    566 |     void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) override;
    567 | #endif
    568 | 
    569 |   private:
    570 | 
    571 | #ifdef HAVE_STEAM
    572 |     void pollSteamConnections();
    573 |     void acceptSteamConnection();
    574 | #endif
    575 | 
    576 |     std::unique_ptr<WorldHistory> readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson);
    577 | 
    578 |     void sendProfilerHistory(SectionData const & data, float scale, bool isSim, std::lock_guard<std::mutex> & server_lock);
```

### .\libs\server\game_server.cpp:787
- Signature: L787: void ConnectionImpl::sendModFileData(ModFileDataPackageBundle const & bundle, size_t estimated_size)
```cpp
    767 | }
    768 | 
    769 | void ConnectionImpl::sendMessage(Json const & json)
    770 | {
    771 |     std::stringstream s;
    772 |     s << json;
    773 | 
    774 |     sendMessage(s.str());
    775 | }
    776 | 
    777 | void ConnectionImpl::sendMessage(std::string const & message)
    778 | {
    779 |     std::lock_guard<std::mutex> server_lock(game_server->mServerMutex);
    780 | 
    781 |     if (state != STATE_Connected)
    782 |         return;
    783 | 
    784 |     cmd_endpoint->sendUp(GameClientCommand::makeMessage(message));
    785 | }
    786 | 
>   787 | void ConnectionImpl::sendModFileData(ModFileDataPackageBundle const & bundle, size_t estimated_size)
    788 | {
    789 |     std::lock_guard<std::mutex> server_lock(game_server->mServerMutex);
    790 | 
    791 |     if (state != STATE_Connected)
    792 |         return;
    793 | 
    794 |     cmd_endpoint->sendUp(GameClientCommand::makeDownloadModFileData(bundle), estimated_size);
    795 | }
    796 | 
    797 | void ConnectionImpl::close()
    798 | {
    799 |     std::lock_guard<std::mutex> server_lock(game_server->mServerMutex);
    800 | 
    801 |     ZU_Info << debug_descr << ": close()";
    802 |     switch (state)
    803 |     {
    804 |         case STATE_Connected:
    805 |         {
    806 |             game_server->closeHistoryConnection(this, server_lock);
    807 |             cmd_endpoint->sendEndOfStream();
```

### .\libs\server\game_server.cpp:794
- Signature: L787: void ConnectionImpl::sendModFileData(ModFileDataPackageBundle const & bundle, size_t estimated_size)
```cpp
    774 |     sendMessage(s.str());
    775 | }
    776 | 
    777 | void ConnectionImpl::sendMessage(std::string const & message)
    778 | {
    779 |     std::lock_guard<std::mutex> server_lock(game_server->mServerMutex);
    780 | 
    781 |     if (state != STATE_Connected)
    782 |         return;
    783 | 
    784 |     cmd_endpoint->sendUp(GameClientCommand::makeMessage(message));
    785 | }
    786 | 
    787 | void ConnectionImpl::sendModFileData(ModFileDataPackageBundle const & bundle, size_t estimated_size)
    788 | {
    789 |     std::lock_guard<std::mutex> server_lock(game_server->mServerMutex);
    790 | 
    791 |     if (state != STATE_Connected)
    792 |         return;
    793 | 
>   794 |     cmd_endpoint->sendUp(GameClientCommand::makeDownloadModFileData(bundle), estimated_size);
    795 | }
    796 | 
    797 | void ConnectionImpl::close()
    798 | {
    799 |     std::lock_guard<std::mutex> server_lock(game_server->mServerMutex);
    800 | 
    801 |     ZU_Info << debug_descr << ": close()";
    802 |     switch (state)
    803 |     {
    804 |         case STATE_Connected:
    805 |         {
    806 |             game_server->closeHistoryConnection(this, server_lock);
    807 |             cmd_endpoint->sendEndOfStream();
    808 |             state = STATE_Closing;
    809 | 
    810 |             Ref<ConnectionImpl> conn(this);
    811 |             hangup_timer = game_server->mServerAlarmClock->whenElapsed(
    812 |                 5,
    813 |                 [conn] () {
    814 |                     HProfiler_Zone("GameServer close timeout");
```

### .\libs\server\game_server.cpp:3236
- Signature: L3231:         else if (cmd.tag() == GameServerCommand::Tags::UploadModFileData)
```cpp
   3216 | 
   3217 |         if (cmd.tag() == GameServerCommand::Tags::Message)
   3218 |         {
   3219 |             Ref<DriverHandle> handle = mDriverHandle;
   3220 |             std::string msg = cmd.getMessage();
   3221 | 
   3222 |             ZU_Info << conn->debug_descr << ": recvCmd msg " << msg;
   3223 | 
   3224 |             mCallbackQueue->enqueue([handle,conn,msg] () {
   3225 |                     if (handle->driver)
   3226 |                         handle->driver->recvMessage(conn, msg);
   3227 |                 });
   3228 | 
   3229 |             continue;
   3230 |         }
   3231 |         else if (cmd.tag() == GameServerCommand::Tags::UploadModFileData)
   3232 |         {
   3233 |             ZU_Info << conn->debug_descr << ": recvCmd sim uploadModData";
   3234 | 
   3235 |             Ref<DriverHandle> handle = mDriverHandle;
>  3236 |             ModFileDataPackageBundleAuthorized bundle_auth = cmd.getUploadModFileData();
   3237 |             mCallbackQueue->enqueue([handle,conn,bundle_auth] () {
   3238 |                     if (handle->driver)
   3239 |                         handle->driver->recvModFileData(conn, bundle_auth);
   3240 |                 });
   3241 | 
   3242 |             continue;
   3243 |         }
   3244 | 
   3245 |         if (!mSimCreated)
   3246 |         {
   3247 |             ZU_Info << conn->debug_descr << ": recvCmd sim not created";
   3248 |             continue;
   3249 |         }
   3250 | 
   3251 |         mSimThread->enqueue([=] () {
   3252 |                 PROFILE_PROBE(mSimProfiler, "issue");
   3253 | 
   3254 |                 if (!mSim)
   3255 |                 {
   3256 |                     ZU_Info << conn->debug_descr << ": recvCmd no sim";
```

### .\libs\server\game_server.cpp:3237
- Signature: L3231:         else if (cmd.tag() == GameServerCommand::Tags::UploadModFileData)
```cpp
   3217 |         if (cmd.tag() == GameServerCommand::Tags::Message)
   3218 |         {
   3219 |             Ref<DriverHandle> handle = mDriverHandle;
   3220 |             std::string msg = cmd.getMessage();
   3221 | 
   3222 |             ZU_Info << conn->debug_descr << ": recvCmd msg " << msg;
   3223 | 
   3224 |             mCallbackQueue->enqueue([handle,conn,msg] () {
   3225 |                     if (handle->driver)
   3226 |                         handle->driver->recvMessage(conn, msg);
   3227 |                 });
   3228 | 
   3229 |             continue;
   3230 |         }
   3231 |         else if (cmd.tag() == GameServerCommand::Tags::UploadModFileData)
   3232 |         {
   3233 |             ZU_Info << conn->debug_descr << ": recvCmd sim uploadModData";
   3234 | 
   3235 |             Ref<DriverHandle> handle = mDriverHandle;
   3236 |             ModFileDataPackageBundleAuthorized bundle_auth = cmd.getUploadModFileData();
>  3237 |             mCallbackQueue->enqueue([handle,conn,bundle_auth] () {
   3238 |                     if (handle->driver)
   3239 |                         handle->driver->recvModFileData(conn, bundle_auth);
   3240 |                 });
   3241 | 
   3242 |             continue;
   3243 |         }
   3244 | 
   3245 |         if (!mSimCreated)
   3246 |         {
   3247 |             ZU_Info << conn->debug_descr << ": recvCmd sim not created";
   3248 |             continue;
   3249 |         }
   3250 | 
   3251 |         mSimThread->enqueue([=] () {
   3252 |                 PROFILE_PROBE(mSimProfiler, "issue");
   3253 | 
   3254 |                 if (!mSim)
   3255 |                 {
   3256 |                     ZU_Info << conn->debug_descr << ": recvCmd no sim";
   3257 |                     return; // Don't crash on race conditions
```

### .\libs\server\game_server.cpp:3239
- Signature: L3231:         else if (cmd.tag() == GameServerCommand::Tags::UploadModFileData)
```cpp
   3219 |             Ref<DriverHandle> handle = mDriverHandle;
   3220 |             std::string msg = cmd.getMessage();
   3221 | 
   3222 |             ZU_Info << conn->debug_descr << ": recvCmd msg " << msg;
   3223 | 
   3224 |             mCallbackQueue->enqueue([handle,conn,msg] () {
   3225 |                     if (handle->driver)
   3226 |                         handle->driver->recvMessage(conn, msg);
   3227 |                 });
   3228 | 
   3229 |             continue;
   3230 |         }
   3231 |         else if (cmd.tag() == GameServerCommand::Tags::UploadModFileData)
   3232 |         {
   3233 |             ZU_Info << conn->debug_descr << ": recvCmd sim uploadModData";
   3234 | 
   3235 |             Ref<DriverHandle> handle = mDriverHandle;
   3236 |             ModFileDataPackageBundleAuthorized bundle_auth = cmd.getUploadModFileData();
   3237 |             mCallbackQueue->enqueue([handle,conn,bundle_auth] () {
   3238 |                     if (handle->driver)
>  3239 |                         handle->driver->recvModFileData(conn, bundle_auth);
   3240 |                 });
   3241 | 
   3242 |             continue;
   3243 |         }
   3244 | 
   3245 |         if (!mSimCreated)
   3246 |         {
   3247 |             ZU_Info << conn->debug_descr << ": recvCmd sim not created";
   3248 |             continue;
   3249 |         }
   3250 | 
   3251 |         mSimThread->enqueue([=] () {
   3252 |                 PROFILE_PROBE(mSimProfiler, "issue");
   3253 | 
   3254 |                 if (!mSim)
   3255 |                 {
   3256 |                     ZU_Info << conn->debug_descr << ": recvCmd no sim";
   3257 |                     return; // Don't crash on race conditions
   3258 |                 }
   3259 | 
```

### .\libs\server\game_server.cpp:4232
- Signature: L4217: bool GameServerImpl::writeReplay(netutil::UberProtoPipe & pipe, Json & inOutInfoJson) const
```cpp
   4212 | 
   4213 |     inOutJson.set("mod_identifiers", mod_identifiers);
   4214 |     inOutJson.set("mod_names", mod_names);
   4215 | }
   4216 | 
   4217 | bool GameServerImpl::writeReplay(netutil::UberProtoPipe & pipe, Json & inOutInfoJson) const
   4218 | {
   4219 |     ZU_ASSERT(inOutInfoJson.isObject());
   4220 | 
   4221 |     // Hold up.  Need to read the history.
   4222 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4223 | 
   4224 |     if (!mServerHistory)
   4225 |         return false;
   4226 | 
   4227 |     ReplayHeader header;
   4228 |     header.version = REPLAY_CUR_VERSION;
   4229 |     header.config = mClientGameConfig;
   4230 |     if (mMountedModCollection && !mMountedModCollection->getMods().empty())
   4231 |     {
>  4232 |         header.modBundle = mMountedModCollection->getDataPackageBundle();
   4233 |     }
   4234 | 
   4235 |     addReplayInfoJson(inOutInfoJson);
   4236 | 
   4237 |     if (!mReplayConfigSummaryJson.isNull())
   4238 |         inOutInfoJson.set("config_summary", mReplayConfigSummaryJson);
   4239 | 
   4240 |     if (!mReplayConfigFullJson.isNull())
   4241 |         inOutInfoJson.set("config", mReplayConfigFullJson);
   4242 | 
   4243 |     if (!mGameConfig.isNull())
   4244 |         inOutInfoJson.set("game", mGameConfig);
   4245 | 
   4246 |     std::stringstream s;
   4247 |     s << inOutInfoJson;
   4248 |     header.infoJson = s.str();
   4249 | 
   4250 |     // clear out configs before writing outInfoJson, since it could potentially be quite large and thus
   4251 |     //  should not be part of the small summary json; it will still be part of the actual replay header itself
   4252 |     if (!mReplayConfigFullJson.isNull())
```

### .\libs\server\game_server.cpp:4295
- Signature: L4281: std::unique_ptr<WorldHistory> GameServerImpl::readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson)
```cpp
   4275 |     mServerHistory.reset(std::move(history));
   4276 |     createHistoryServer(replay_header.config, server_lock);
   4277 | 
   4278 |     return true;
   4279 | }
   4280 | 
   4281 | std::unique_ptr<WorldHistory> GameServerImpl::readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson)
   4282 | {
   4283 |     ZU_ASSERT(outInfoJson.isObject());
   4284 | 
   4285 |     if (mServerHistory)
   4286 |         throw std::runtime_error("game already has a history");
   4287 | 
   4288 |     if (!pipe.recvUp(outReplayHeader))
   4289 |         return nullptr;
   4290 | 
   4291 |     if ((outReplayHeader.version < REPLAY_MIN_VERSION) || (outReplayHeader.version > REPLAY_CUR_VERSION))
   4292 |         return nullptr;
   4293 | 
   4294 |     bool has_mods = false;
>  4295 |     if (!outReplayHeader.modBundle.packages.empty())
   4296 |     {
   4297 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(outReplayHeader.modBundle, "server");
   4298 | 
   4299 |         if (!mLoadedModCollection)
   4300 |         {
   4301 |             ZU_Error << "GameServerImpl::readReplay: Unable to load mod collection from mod file data bundle in replay file";
   4302 |         }
   4303 |         else
   4304 |         {
   4305 |             has_mods = mountMods(server_lock);
   4306 |         }
   4307 |     }
   4308 | 
   4309 |     if (!outReplayHeader.infoJson.empty())
   4310 |     {
   4311 |         outInfoJson = parseJson(outReplayHeader.infoJson);
   4312 |     }
   4313 | 
   4314 |     outInfoJson.set("hasMods", Json::makeBoolean(has_mods));
   4315 | 
```

### .\libs\server\game_server.cpp:4297
- Signature: L4281: std::unique_ptr<WorldHistory> GameServerImpl::readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson)
```cpp
   4277 | 
   4278 |     return true;
   4279 | }
   4280 | 
   4281 | std::unique_ptr<WorldHistory> GameServerImpl::readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson)
   4282 | {
   4283 |     ZU_ASSERT(outInfoJson.isObject());
   4284 | 
   4285 |     if (mServerHistory)
   4286 |         throw std::runtime_error("game already has a history");
   4287 | 
   4288 |     if (!pipe.recvUp(outReplayHeader))
   4289 |         return nullptr;
   4290 | 
   4291 |     if ((outReplayHeader.version < REPLAY_MIN_VERSION) || (outReplayHeader.version > REPLAY_CUR_VERSION))
   4292 |         return nullptr;
   4293 | 
   4294 |     bool has_mods = false;
   4295 |     if (!outReplayHeader.modBundle.packages.empty())
   4296 |     {
>  4297 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(outReplayHeader.modBundle, "server");
   4298 | 
   4299 |         if (!mLoadedModCollection)
   4300 |         {
   4301 |             ZU_Error << "GameServerImpl::readReplay: Unable to load mod collection from mod file data bundle in replay file";
   4302 |         }
   4303 |         else
   4304 |         {
   4305 |             has_mods = mountMods(server_lock);
   4306 |         }
   4307 |     }
   4308 | 
   4309 |     if (!outReplayHeader.infoJson.empty())
   4310 |     {
   4311 |         outInfoJson = parseJson(outReplayHeader.infoJson);
   4312 |     }
   4313 | 
   4314 |     outInfoJson.set("hasMods", Json::makeBoolean(has_mods));
   4315 | 
   4316 |     std::unique_ptr<WorldHistory> history(new WorldHistory());
   4317 |     if (!history->recvUp(pipe, &mEntityFactory))
```

### .\libs\server\game_server.cpp:4301
- Signature: L4281: std::unique_ptr<WorldHistory> GameServerImpl::readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson)
```cpp
   4281 | std::unique_ptr<WorldHistory> GameServerImpl::readReplay(std::unique_lock<std::mutex> & server_lock, netutil::UberProtoPipe & pipe, ReplayHeader & outReplayHeader, Json & outInfoJson)
   4282 | {
   4283 |     ZU_ASSERT(outInfoJson.isObject());
   4284 | 
   4285 |     if (mServerHistory)
   4286 |         throw std::runtime_error("game already has a history");
   4287 | 
   4288 |     if (!pipe.recvUp(outReplayHeader))
   4289 |         return nullptr;
   4290 | 
   4291 |     if ((outReplayHeader.version < REPLAY_MIN_VERSION) || (outReplayHeader.version > REPLAY_CUR_VERSION))
   4292 |         return nullptr;
   4293 | 
   4294 |     bool has_mods = false;
   4295 |     if (!outReplayHeader.modBundle.packages.empty())
   4296 |     {
   4297 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(outReplayHeader.modBundle, "server");
   4298 | 
   4299 |         if (!mLoadedModCollection)
   4300 |         {
>  4301 |             ZU_Error << "GameServerImpl::readReplay: Unable to load mod collection from mod file data bundle in replay file";
   4302 |         }
   4303 |         else
   4304 |         {
   4305 |             has_mods = mountMods(server_lock);
   4306 |         }
   4307 |     }
   4308 | 
   4309 |     if (!outReplayHeader.infoJson.empty())
   4310 |     {
   4311 |         outInfoJson = parseJson(outReplayHeader.infoJson);
   4312 |     }
   4313 | 
   4314 |     outInfoJson.set("hasMods", Json::makeBoolean(has_mods));
   4315 | 
   4316 |     std::unique_ptr<WorldHistory> history(new WorldHistory());
   4317 |     if (!history->recvUp(pipe, &mEntityFactory))
   4318 |         return nullptr;
   4319 | 
   4320 |     ZU_Info << "Replay Header outInfoJson : " << outInfoJson;
   4321 | 
```

### .\libs\server\game_server.cpp:4534
- Signature: L4534: bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
```cpp
   4514 |     }
   4515 | 
   4516 |     desc.set("all_history", stats.toJson());
   4517 | }
   4518 | 
   4519 | std::string GameServerImpl::getModUpdateAuthToken() const
   4520 | {
   4521 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4522 | 
   4523 |     return mModUpdateAuthToken;
   4524 | }
   4525 | 
   4526 | void GameServerImpl::resetModUpdateAuthToken()
   4527 | {
   4528 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4529 | 
   4530 |     mModUpdateAuthToken = UUID::random().toString();
   4531 |     ZU_Info << "GameServerImpl::resetModUpdateAuthToken: Auth token reset to \"" << mModUpdateAuthToken << "\"";
   4532 | }
   4533 | 
>  4534 | bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
   4535 | {
   4536 |     std::unique_lock<std::mutex> server_lock(mServerMutex);
   4537 | 
   4538 |     bool result = false;
   4539 |     bool authorized = true;
   4540 |     auto expected_auth_token = mModUpdateAuthToken;
   4541 |     auto const & check_auth_token = bundle_auth.auth_token;
   4542 |     if (!expected_auth_token.empty())
   4543 |     {
   4544 |         if (!string_equals(expected_auth_token, check_auth_token))
   4545 |         {
   4546 |             authorized = false;
   4547 |         }
   4548 |     }
   4549 | 
   4550 |     if (authorized)
   4551 |     {
   4552 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle_auth.bundle, "server");
   4553 |         if (!mLoadedModCollection)
   4554 |         {
```

### .\libs\server\game_server.cpp:4541
- Signature: L4534: bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
```cpp
   4521 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4522 | 
   4523 |     return mModUpdateAuthToken;
   4524 | }
   4525 | 
   4526 | void GameServerImpl::resetModUpdateAuthToken()
   4527 | {
   4528 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4529 | 
   4530 |     mModUpdateAuthToken = UUID::random().toString();
   4531 |     ZU_Info << "GameServerImpl::resetModUpdateAuthToken: Auth token reset to \"" << mModUpdateAuthToken << "\"";
   4532 | }
   4533 | 
   4534 | bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
   4535 | {
   4536 |     std::unique_lock<std::mutex> server_lock(mServerMutex);
   4537 | 
   4538 |     bool result = false;
   4539 |     bool authorized = true;
   4540 |     auto expected_auth_token = mModUpdateAuthToken;
>  4541 |     auto const & check_auth_token = bundle_auth.auth_token;
   4542 |     if (!expected_auth_token.empty())
   4543 |     {
   4544 |         if (!string_equals(expected_auth_token, check_auth_token))
   4545 |         {
   4546 |             authorized = false;
   4547 |         }
   4548 |     }
   4549 | 
   4550 |     if (authorized)
   4551 |     {
   4552 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle_auth.bundle, "server");
   4553 |         if (!mLoadedModCollection)
   4554 |         {
   4555 |             ZU_Error << "GameServerImpl::loadAndMountModFileData: Unable to load mod collection from mod file data bundle";
   4556 |         }
   4557 |         else
   4558 |         {
   4559 |             result = mountMods(server_lock);
   4560 |         }
   4561 |     }
```

### .\libs\server\game_server.cpp:4552
- Signature: L4534: bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
```cpp
   4532 | }
   4533 | 
   4534 | bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
   4535 | {
   4536 |     std::unique_lock<std::mutex> server_lock(mServerMutex);
   4537 | 
   4538 |     bool result = false;
   4539 |     bool authorized = true;
   4540 |     auto expected_auth_token = mModUpdateAuthToken;
   4541 |     auto const & check_auth_token = bundle_auth.auth_token;
   4542 |     if (!expected_auth_token.empty())
   4543 |     {
   4544 |         if (!string_equals(expected_auth_token, check_auth_token))
   4545 |         {
   4546 |             authorized = false;
   4547 |         }
   4548 |     }
   4549 | 
   4550 |     if (authorized)
   4551 |     {
>  4552 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle_auth.bundle, "server");
   4553 |         if (!mLoadedModCollection)
   4554 |         {
   4555 |             ZU_Error << "GameServerImpl::loadAndMountModFileData: Unable to load mod collection from mod file data bundle";
   4556 |         }
   4557 |         else
   4558 |         {
   4559 |             result = mountMods(server_lock);
   4560 |         }
   4561 |     }
   4562 |     else
   4563 |     {
   4564 |         ZU_Info << "GameServerImpl::loadAndMountModFileData: Ignoring mod file data due to invalid authentication token \"" << check_auth_token << "\", expected \"" << expected_auth_token << "\" (token may have been changed if mod data updates cheat is not enabled)";
   4565 |     }
   4566 | 
   4567 |     return result;
   4568 | }
   4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
```

### .\libs\server\game_server.cpp:4555
- Signature: L4534: bool GameServerImpl::loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth)
```cpp
   4535 | {
   4536 |     std::unique_lock<std::mutex> server_lock(mServerMutex);
   4537 | 
   4538 |     bool result = false;
   4539 |     bool authorized = true;
   4540 |     auto expected_auth_token = mModUpdateAuthToken;
   4541 |     auto const & check_auth_token = bundle_auth.auth_token;
   4542 |     if (!expected_auth_token.empty())
   4543 |     {
   4544 |         if (!string_equals(expected_auth_token, check_auth_token))
   4545 |         {
   4546 |             authorized = false;
   4547 |         }
   4548 |     }
   4549 | 
   4550 |     if (authorized)
   4551 |     {
   4552 |         mLoadedModCollection = modutil::LoadedRemoteModCollection::loadRemoteModCollection(bundle_auth.bundle, "server");
   4553 |         if (!mLoadedModCollection)
   4554 |         {
>  4555 |             ZU_Error << "GameServerImpl::loadAndMountModFileData: Unable to load mod collection from mod file data bundle";
   4556 |         }
   4557 |         else
   4558 |         {
   4559 |             result = mountMods(server_lock);
   4560 |         }
   4561 |     }
   4562 |     else
   4563 |     {
   4564 |         ZU_Info << "GameServerImpl::loadAndMountModFileData: Ignoring mod file data due to invalid authentication token \"" << check_auth_token << "\", expected \"" << expected_auth_token << "\" (token may have been changed if mod data updates cheat is not enabled)";
   4565 |     }
   4566 | 
   4567 |     return result;
   4568 | }
   4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
   4573 |     return mMountedModCollection ? mMountedModCollection->getModsJsonArray() : Json::makeArray();
   4574 | }
   4575 | 
```

### .\libs\server\game_server.cpp:4576
- Signature: L4576: ModFileDataPackageBundle GameServerImpl::getMountedModsDataPackageBundle() const
```cpp
   4556 |         }
   4557 |         else
   4558 |         {
   4559 |             result = mountMods(server_lock);
   4560 |         }
   4561 |     }
   4562 |     else
   4563 |     {
   4564 |         ZU_Info << "GameServerImpl::loadAndMountModFileData: Ignoring mod file data due to invalid authentication token \"" << check_auth_token << "\", expected \"" << expected_auth_token << "\" (token may have been changed if mod data updates cheat is not enabled)";
   4565 |     }
   4566 | 
   4567 |     return result;
   4568 | }
   4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
   4573 |     return mMountedModCollection ? mMountedModCollection->getModsJsonArray() : Json::makeArray();
   4574 | }
   4575 | 
>  4576 | ModFileDataPackageBundle GameServerImpl::getMountedModsDataPackageBundle() const
   4577 | {
   4578 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4579 | 
   4580 |     return mMountedModCollection ? mMountedModCollection->getDataPackageBundle() : ModFileDataPackageBundle();
   4581 | }
   4582 | 
   4583 | size_t GameServerImpl::getMountedModsDataPackageBundleEstimatedSize() const
   4584 | {
   4585 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4586 | 
   4587 |     return mMountedModCollection ? mMountedModCollection->getEstimatedSize() : 1;
   4588 | }
   4589 | 
   4590 | bool GameServerImpl::mountMods(std::unique_lock<std::mutex> & server_lock)
   4591 | {
   4592 |     ZU_ASSERT(mLoadedModCollection != nullptr); // should only call this if we know we have a loaded mod collection
   4593 | 
   4594 |     bool result = false;
   4595 | 
   4596 |     auto mfs = mSpecLib->filesystem()->isMemoryFilesystem();
```

### .\libs\server\game_server.cpp:4580
- Signature: L4576: ModFileDataPackageBundle GameServerImpl::getMountedModsDataPackageBundle() const
```cpp
   4560 |         }
   4561 |     }
   4562 |     else
   4563 |     {
   4564 |         ZU_Info << "GameServerImpl::loadAndMountModFileData: Ignoring mod file data due to invalid authentication token \"" << check_auth_token << "\", expected \"" << expected_auth_token << "\" (token may have been changed if mod data updates cheat is not enabled)";
   4565 |     }
   4566 | 
   4567 |     return result;
   4568 | }
   4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
   4573 |     return mMountedModCollection ? mMountedModCollection->getModsJsonArray() : Json::makeArray();
   4574 | }
   4575 | 
   4576 | ModFileDataPackageBundle GameServerImpl::getMountedModsDataPackageBundle() const
   4577 | {
   4578 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4579 | 
>  4580 |     return mMountedModCollection ? mMountedModCollection->getDataPackageBundle() : ModFileDataPackageBundle();
   4581 | }
   4582 | 
   4583 | size_t GameServerImpl::getMountedModsDataPackageBundleEstimatedSize() const
   4584 | {
   4585 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4586 | 
   4587 |     return mMountedModCollection ? mMountedModCollection->getEstimatedSize() : 1;
   4588 | }
   4589 | 
   4590 | bool GameServerImpl::mountMods(std::unique_lock<std::mutex> & server_lock)
   4591 | {
   4592 |     ZU_ASSERT(mLoadedModCollection != nullptr); // should only call this if we know we have a loaded mod collection
   4593 | 
   4594 |     bool result = false;
   4595 | 
   4596 |     auto mfs = mSpecLib->filesystem()->isMemoryFilesystem();
   4597 |     if (mfs)
   4598 |     {
   4599 |         if (mMountedModCollection)
   4600 |         {
```

### .\libs\server\game_server.cpp:4583
- Signature: L4583: size_t GameServerImpl::getMountedModsDataPackageBundleEstimatedSize() const
```cpp
   4563 |     {
   4564 |         ZU_Info << "GameServerImpl::loadAndMountModFileData: Ignoring mod file data due to invalid authentication token \"" << check_auth_token << "\", expected \"" << expected_auth_token << "\" (token may have been changed if mod data updates cheat is not enabled)";
   4565 |     }
   4566 | 
   4567 |     return result;
   4568 | }
   4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
   4573 |     return mMountedModCollection ? mMountedModCollection->getModsJsonArray() : Json::makeArray();
   4574 | }
   4575 | 
   4576 | ModFileDataPackageBundle GameServerImpl::getMountedModsDataPackageBundle() const
   4577 | {
   4578 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4579 | 
   4580 |     return mMountedModCollection ? mMountedModCollection->getDataPackageBundle() : ModFileDataPackageBundle();
   4581 | }
   4582 | 
>  4583 | size_t GameServerImpl::getMountedModsDataPackageBundleEstimatedSize() const
   4584 | {
   4585 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4586 | 
   4587 |     return mMountedModCollection ? mMountedModCollection->getEstimatedSize() : 1;
   4588 | }
   4589 | 
   4590 | bool GameServerImpl::mountMods(std::unique_lock<std::mutex> & server_lock)
   4591 | {
   4592 |     ZU_ASSERT(mLoadedModCollection != nullptr); // should only call this if we know we have a loaded mod collection
   4593 | 
   4594 |     bool result = false;
   4595 | 
   4596 |     auto mfs = mSpecLib->filesystem()->isMemoryFilesystem();
   4597 |     if (mfs)
   4598 |     {
   4599 |         if (mMountedModCollection)
   4600 |         {
   4601 |             mMountedModCollection->unmount();
   4602 |             mDriverHandle->driver->mountContent(mRequiredContent);
   4603 |         }
```

### .\libs\server\game_server.cpp:4587
- Signature: L4583: size_t GameServerImpl::getMountedModsDataPackageBundleEstimatedSize() const
```cpp
   4567 |     return result;
   4568 | }
   4569 | Json GameServerImpl::getMountedModsJsonArray() const
   4570 | {
   4571 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4572 | 
   4573 |     return mMountedModCollection ? mMountedModCollection->getModsJsonArray() : Json::makeArray();
   4574 | }
   4575 | 
   4576 | ModFileDataPackageBundle GameServerImpl::getMountedModsDataPackageBundle() const
   4577 | {
   4578 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4579 | 
   4580 |     return mMountedModCollection ? mMountedModCollection->getDataPackageBundle() : ModFileDataPackageBundle();
   4581 | }
   4582 | 
   4583 | size_t GameServerImpl::getMountedModsDataPackageBundleEstimatedSize() const
   4584 | {
   4585 |     std::lock_guard<std::mutex> server_lock(mServerMutex);
   4586 | 
>  4587 |     return mMountedModCollection ? mMountedModCollection->getEstimatedSize() : 1;
   4588 | }
   4589 | 
   4590 | bool GameServerImpl::mountMods(std::unique_lock<std::mutex> & server_lock)
   4591 | {
   4592 |     ZU_ASSERT(mLoadedModCollection != nullptr); // should only call this if we know we have a loaded mod collection
   4593 | 
   4594 |     bool result = false;
   4595 | 
   4596 |     auto mfs = mSpecLib->filesystem()->isMemoryFilesystem();
   4597 |     if (mfs)
   4598 |     {
   4599 |         if (mMountedModCollection)
   4600 |         {
   4601 |             mMountedModCollection->unmount();
   4602 |             mDriverHandle->driver->mountContent(mRequiredContent);
   4603 |         }
   4604 | 
   4605 |         mMountedModCollection = mLoadedModCollection->mountToMemoryFilesystem(mfs);
   4606 | 
   4607 |         // invalidate specs for any entries that have been updated
```

### .\libs\server\game_server.cpp:4611
- Signature: L4590: bool GameServerImpl::mountMods(std::unique_lock<std::mutex> & server_lock)
```cpp
   4591 | {
   4592 |     ZU_ASSERT(mLoadedModCollection != nullptr); // should only call this if we know we have a loaded mod collection
   4593 | 
   4594 |     bool result = false;
   4595 | 
   4596 |     auto mfs = mSpecLib->filesystem()->isMemoryFilesystem();
   4597 |     if (mfs)
   4598 |     {
   4599 |         if (mMountedModCollection)
   4600 |         {
   4601 |             mMountedModCollection->unmount();
   4602 |             mDriverHandle->driver->mountContent(mRequiredContent);
   4603 |         }
   4604 | 
   4605 |         mMountedModCollection = mLoadedModCollection->mountToMemoryFilesystem(mfs);
   4606 | 
   4607 |         // invalidate specs for any entries that have been updated
   4608 |         if (mMountedModCollection != nullptr)
   4609 |         {
   4610 |             size_t entryCount = 0;
>  4611 |             auto const & bundle = mMountedModCollection->getDataPackageBundle();
   4612 |             for (auto const & package : bundle.packages)
   4613 |             {
   4614 |                 for (auto const & entry : package.entries)
   4615 |                 {
   4616 |                     mSpecLib->invalidate(entry.fileName);
   4617 |                     ++entryCount;
   4618 |                 }
   4619 |             }
   4620 | 
   4621 |             if (mSimCreated)
   4622 |             {
   4623 |                 mSimThread->enqueue([this] () {
   4624 |                         for (auto & kvp : mSim->world().unit_type_db)
   4625 |                             kvp.second->enqueueReloadUnitSpecs();
   4626 | 
   4627 |                         // We don't need to explicitly reload the all
   4628 |                         // unit type db, because the preceding reloads
   4629 |                         // are enqueued on a custom task queue that
   4630 |                         // follows the task with a rebuild of the all
   4631 |                         // unit type db (see
```

### .\libs\server\game_server.cpp:4612
- Signature: L4590: bool GameServerImpl::mountMods(std::unique_lock<std::mutex> & server_lock)
```cpp
   4592 |     ZU_ASSERT(mLoadedModCollection != nullptr); // should only call this if we know we have a loaded mod collection
   4593 | 
   4594 |     bool result = false;
   4595 | 
   4596 |     auto mfs = mSpecLib->filesystem()->isMemoryFilesystem();
   4597 |     if (mfs)
   4598 |     {
   4599 |         if (mMountedModCollection)
   4600 |         {
   4601 |             mMountedModCollection->unmount();
   4602 |             mDriverHandle->driver->mountContent(mRequiredContent);
   4603 |         }
   4604 | 
   4605 |         mMountedModCollection = mLoadedModCollection->mountToMemoryFilesystem(mfs);
   4606 | 
   4607 |         // invalidate specs for any entries that have been updated
   4608 |         if (mMountedModCollection != nullptr)
   4609 |         {
   4610 |             size_t entryCount = 0;
   4611 |             auto const & bundle = mMountedModCollection->getDataPackageBundle();
>  4612 |             for (auto const & package : bundle.packages)
   4613 |             {
   4614 |                 for (auto const & entry : package.entries)
   4615 |                 {
   4616 |                     mSpecLib->invalidate(entry.fileName);
   4617 |                     ++entryCount;
   4618 |                 }
   4619 |             }
   4620 | 
   4621 |             if (mSimCreated)
   4622 |             {
   4623 |                 mSimThread->enqueue([this] () {
   4624 |                         for (auto & kvp : mSim->world().unit_type_db)
   4625 |                             kvp.second->enqueueReloadUnitSpecs();
   4626 | 
   4627 |                         // We don't need to explicitly reload the all
   4628 |                         // unit type db, because the preceding reloads
   4629 |                         // are enqueued on a custom task queue that
   4630 |                         // follows the task with a rebuild of the all
   4631 |                         // unit type db (see
   4632 |                         // SimWorld::SimWorldUnitTypeDBWatcher).
```

### .\libs\server\game_server.cpp:4636
- Signature: L4590: bool GameServerImpl::mountMods(std::unique_lock<std::mutex> & server_lock)
```cpp
   4616 |                     mSpecLib->invalidate(entry.fileName);
   4617 |                     ++entryCount;
   4618 |                 }
   4619 |             }
   4620 | 
   4621 |             if (mSimCreated)
   4622 |             {
   4623 |                 mSimThread->enqueue([this] () {
   4624 |                         for (auto & kvp : mSim->world().unit_type_db)
   4625 |                             kvp.second->enqueueReloadUnitSpecs();
   4626 | 
   4627 |                         // We don't need to explicitly reload the all
   4628 |                         // unit type db, because the preceding reloads
   4629 |                         // are enqueued on a custom task queue that
   4630 |                         // follows the task with a rebuild of the all
   4631 |                         // unit type db (see
   4632 |                         // SimWorld::SimWorldUnitTypeDBWatcher).
   4633 |                     });
   4634 |             }
   4635 | 
>  4636 |             ZU_Info << "GameServerImpl::mountMods: Successfully mounted mod bundle, " << bundle.packages.size() << " packages, " << entryCount << " entries total.";
   4637 | 
   4638 |             // Join all mod display names into single string
   4639 |             std::string mod_names;
   4640 |             for (auto const & mod_info : mMountedModCollection->getMods())
   4641 |             {
   4642 |                 if (!mod_names.empty())
   4643 |                     mod_names.append(", ");
   4644 | 
   4645 |                 mod_names.append(mod_info->display_name);
   4646 |             }
   4647 | 
   4648 |             if (!mod_names.empty())
   4649 |                 breakpadutil::setUploadParam("MountedServerMods", mod_names);
   4650 | 
   4651 |             result = true;
   4652 |         }
   4653 |     }
   4654 |     else
   4655 |     {
   4656 |         ZU_Error << "GameServerImpl::mountMods: Platform Filesystem is not a MemoryFilesystem; memory files are not supported";
```

### .\libs\server\game_server.h:9
- Signature: Not found within 120 lines above match
```cpp
      1 | #ifndef LIBS_SERVER_GAME_SERVER_H
      2 | #define LIBS_SERVER_GAME_SERVER_H
      3 | 
      4 | #include <libs/pasim/ai/aibrain_server_data_types.h>
      5 | 
      6 | #include <libs/paent/feature_types.h>
      7 | #include <libs/paent/diplomatic_state.h>
      8 | 
>     9 | #include <engine/crom/mod_file_data_package_bundle.h>
     10 | #include <engine/crom/mod_file_data_package_bundle_authorized.h>
     11 | 
     12 | #include <libs/nav/path_types.h>
     13 | 
     14 | #include <libs/history/entity.h>
     15 | 
     16 | #include <engine/ubernet/ubernet_gameserver_service.h>
     17 | 
     18 | #include <engine/zu/config.h>
     19 | #include <engine/zu/counted.h>
     20 | #include <engine/zu/strutil.h>
     21 | #include <engine/zu/color.h>
     22 | #include <engine/zu/vecmath.h>
     23 | 
     24 | #include <string>
     25 | #include <ostream>
     26 | #include <memory>
     27 | 
     28 | namespace crom
     29 | {
```

### .\libs\server\game_server.h:10
- Signature: Not found within 120 lines above match
```cpp
      1 | #ifndef LIBS_SERVER_GAME_SERVER_H
      2 | #define LIBS_SERVER_GAME_SERVER_H
      3 | 
      4 | #include <libs/pasim/ai/aibrain_server_data_types.h>
      5 | 
      6 | #include <libs/paent/feature_types.h>
      7 | #include <libs/paent/diplomatic_state.h>
      8 | 
      9 | #include <engine/crom/mod_file_data_package_bundle.h>
>    10 | #include <engine/crom/mod_file_data_package_bundle_authorized.h>
     11 | 
     12 | #include <libs/nav/path_types.h>
     13 | 
     14 | #include <libs/history/entity.h>
     15 | 
     16 | #include <engine/ubernet/ubernet_gameserver_service.h>
     17 | 
     18 | #include <engine/zu/config.h>
     19 | #include <engine/zu/counted.h>
     20 | #include <engine/zu/strutil.h>
     21 | #include <engine/zu/color.h>
     22 | #include <engine/zu/vecmath.h>
     23 | 
     24 | #include <string>
     25 | #include <ostream>
     26 | #include <memory>
     27 | 
     28 | namespace crom
     29 | {
     30 |     class Profiler;
```

### .\libs\server\game_server.h:85
- Signature: Not found within 120 lines above match
```cpp
     65 |     struct Sphere;
     66 |     class AlarmClock;
     67 | }
     68 | 
     69 | namespace nav
     70 | {
     71 |     struct Sector;
     72 |     class DebugHelper;
     73 | }
     74 | 
     75 | class ISteamNetworkingSockets;
     76 | 
     77 | struct CollisionTri;
     78 | struct CollisionMesh;
     79 | struct PlanetBP;
     80 | struct GameConfig;
     81 | struct WorldHistory;
     82 | struct Resources;
     83 | struct IssueTargetedOrderData;
     84 | struct IssueSelfDestructData;
>    85 | struct ModFileDataPackageBundle;
     86 | struct ModFileDataPackageBundleAuthorized;
     87 | struct PlanetInfo;
     88 | struct ArmyInfo;
     89 | struct ArmyStats;
     90 | struct PlayerInfo;
     91 | struct UnitInfo;
     92 | struct EffectInfo;
     93 | 
     94 | class PlanetHandle : public zu::Counted
     95 | {
     96 |   public:
     97 |     virtual EntityId id() const = 0;
     98 |     virtual PlanetBP const * blueprint() const = 0;
     99 |     virtual void getInfo(PlanetInfo & info) = 0;
    100 | 
    101 |     virtual zu::RefNoCount<CollisionMesh const> rayHitTest(zu::Vec3f& outPos, float & outDist, CollisionTri const * & outFace,
    102 |                                                            zu::Ray const & inRay, WorldLayers worldLayerFlags = WL_AnyLayer,
    103 |                                                            bool pathableOnly = false ) const = 0;
    104 | 
    105 |     virtual zu::RefNoCount<CollisionMesh const> segHitTest(zu::Vec3f& outPos, CollisionTri const * & outFace,
```

### .\libs\server\game_server.h:86
- Signature: Not found within 120 lines above match
```cpp
     66 |     class AlarmClock;
     67 | }
     68 | 
     69 | namespace nav
     70 | {
     71 |     struct Sector;
     72 |     class DebugHelper;
     73 | }
     74 | 
     75 | class ISteamNetworkingSockets;
     76 | 
     77 | struct CollisionTri;
     78 | struct CollisionMesh;
     79 | struct PlanetBP;
     80 | struct GameConfig;
     81 | struct WorldHistory;
     82 | struct Resources;
     83 | struct IssueTargetedOrderData;
     84 | struct IssueSelfDestructData;
     85 | struct ModFileDataPackageBundle;
>    86 | struct ModFileDataPackageBundleAuthorized;
     87 | struct PlanetInfo;
     88 | struct ArmyInfo;
     89 | struct ArmyStats;
     90 | struct PlayerInfo;
     91 | struct UnitInfo;
     92 | struct EffectInfo;
     93 | 
     94 | class PlanetHandle : public zu::Counted
     95 | {
     96 |   public:
     97 |     virtual EntityId id() const = 0;
     98 |     virtual PlanetBP const * blueprint() const = 0;
     99 |     virtual void getInfo(PlanetInfo & info) = 0;
    100 | 
    101 |     virtual zu::RefNoCount<CollisionMesh const> rayHitTest(zu::Vec3f& outPos, float & outDist, CollisionTri const * & outFace,
    102 |                                                            zu::Ray const & inRay, WorldLayers worldLayerFlags = WL_AnyLayer,
    103 |                                                            bool pathableOnly = false ) const = 0;
    104 | 
    105 |     virtual zu::RefNoCount<CollisionMesh const> segHitTest(zu::Vec3f& outPos, CollisionTri const * & outFace,
    106 |                                                            zu::Vec3f const& seg0, zu::Vec3f const& seg1,
```

### .\libs\server\game_server.h:273
- Signature: L192:     virtual ~GameServer() { }
```cpp
    253 |     virtual void issueSelfDestruct(IssueSelfDestructData const & data) = 0;
    254 | 
    255 |     virtual void dumpHistory(std::ostream & stream) = 0;
    256 | 
    257 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, zu::Json & outInfoJson) = 0;
    258 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, zu::Json & inOutInfoJson) const = 0;
    259 |     virtual void setReplayConfig(zu::Json const & replayConfigSummaryJson, zu::Json const & replayConfigFullJson) = 0;
    260 |     virtual void setGameConfig(zu::Json const & config) = 0;
    261 |     virtual zu::Json getGameConfig() = 0;
    262 |     virtual zu::Json getReplayConfigSummary() = 0;
    263 |     virtual zu::Json getFullReplayConfig() = 0;
    264 | 
    265 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, zu::Json & outInfoJson) = 0;
    266 |     virtual void createSimFromReplay() = 0;
    267 |     virtual void trimHistoryAndStartSim(float load_time) = 0;
    268 | 
    269 |     virtual void describeHistoryStats(zu::Json desc) const = 0;
    270 | 
    271 |     virtual std::string getModUpdateAuthToken() const = 0;
    272 |     virtual void resetModUpdateAuthToken() = 0;
>   273 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) = 0;
    274 |     virtual zu::Json getMountedModsJsonArray() const = 0;
    275 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const = 0;
    276 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const = 0;
    277 | 
    278 |     virtual void toggleNavDebug() = 0;
    279 |     virtual void initDropletTest(zu::Vec3f const & position) = 0;
    280 | 
    281 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) = 0;
    282 | 
    283 | #ifdef HAVE_STEAM
    284 |     virtual void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) = 0;
    285 | #endif
    286 | };
    287 | 
    288 | class GameServer::Connection : public zu::Counted
    289 | {
    290 |   public:
    291 |     virtual std::string const & playerName() const = 0;
    292 |     virtual std::string const & playerIdentity() const = 0;
    293 |     virtual std::string const & debugDescription() const = 0;
```

### .\libs\server\game_server.h:275
- Signature: L192:     virtual ~GameServer() { }
```cpp
    255 |     virtual void dumpHistory(std::ostream & stream) = 0;
    256 | 
    257 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, zu::Json & outInfoJson) = 0;
    258 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, zu::Json & inOutInfoJson) const = 0;
    259 |     virtual void setReplayConfig(zu::Json const & replayConfigSummaryJson, zu::Json const & replayConfigFullJson) = 0;
    260 |     virtual void setGameConfig(zu::Json const & config) = 0;
    261 |     virtual zu::Json getGameConfig() = 0;
    262 |     virtual zu::Json getReplayConfigSummary() = 0;
    263 |     virtual zu::Json getFullReplayConfig() = 0;
    264 | 
    265 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, zu::Json & outInfoJson) = 0;
    266 |     virtual void createSimFromReplay() = 0;
    267 |     virtual void trimHistoryAndStartSim(float load_time) = 0;
    268 | 
    269 |     virtual void describeHistoryStats(zu::Json desc) const = 0;
    270 | 
    271 |     virtual std::string getModUpdateAuthToken() const = 0;
    272 |     virtual void resetModUpdateAuthToken() = 0;
    273 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) = 0;
    274 |     virtual zu::Json getMountedModsJsonArray() const = 0;
>   275 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const = 0;
    276 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const = 0;
    277 | 
    278 |     virtual void toggleNavDebug() = 0;
    279 |     virtual void initDropletTest(zu::Vec3f const & position) = 0;
    280 | 
    281 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) = 0;
    282 | 
    283 | #ifdef HAVE_STEAM
    284 |     virtual void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) = 0;
    285 | #endif
    286 | };
    287 | 
    288 | class GameServer::Connection : public zu::Counted
    289 | {
    290 |   public:
    291 |     virtual std::string const & playerName() const = 0;
    292 |     virtual std::string const & playerIdentity() const = 0;
    293 |     virtual std::string const & debugDescription() const = 0;
    294 |     virtual std::string const & playerData() const = 0;
    295 |     virtual zu::Ref<net::GSPlayerInfo> ubernetData() const = 0;
```

### .\libs\server\game_server.h:276
- Signature: L192:     virtual ~GameServer() { }
```cpp
    256 | 
    257 |     virtual bool loadReplay(netutil::UberProtoPipe & pipe, zu::Json & outInfoJson) = 0;
    258 |     virtual bool writeReplay(netutil::UberProtoPipe & pipe, zu::Json & inOutInfoJson) const = 0;
    259 |     virtual void setReplayConfig(zu::Json const & replayConfigSummaryJson, zu::Json const & replayConfigFullJson) = 0;
    260 |     virtual void setGameConfig(zu::Json const & config) = 0;
    261 |     virtual zu::Json getGameConfig() = 0;
    262 |     virtual zu::Json getReplayConfigSummary() = 0;
    263 |     virtual zu::Json getFullReplayConfig() = 0;
    264 | 
    265 |     virtual bool loadSave(netutil::UberProtoPipe & pipe, float load_time, zu::Json & outInfoJson) = 0;
    266 |     virtual void createSimFromReplay() = 0;
    267 |     virtual void trimHistoryAndStartSim(float load_time) = 0;
    268 | 
    269 |     virtual void describeHistoryStats(zu::Json desc) const = 0;
    270 | 
    271 |     virtual std::string getModUpdateAuthToken() const = 0;
    272 |     virtual void resetModUpdateAuthToken() = 0;
    273 |     virtual bool loadAndMountModFileData(ModFileDataPackageBundleAuthorized const & bundle_auth) = 0;
    274 |     virtual zu::Json getMountedModsJsonArray() const = 0;
    275 |     virtual ModFileDataPackageBundle getMountedModsDataPackageBundle() const = 0;
>   276 |     virtual size_t getMountedModsDataPackageBundleEstimatedSize() const = 0;
    277 | 
    278 |     virtual void toggleNavDebug() = 0;
    279 |     virtual void initDropletTest(zu::Vec3f const & position) = 0;
    280 | 
    281 |     virtual void setRequiredContent(std::vector<std::string> const & requiredContent) = 0;
    282 | 
    283 | #ifdef HAVE_STEAM
    284 |     virtual void setSteamNetworkingEnabled(bool enabled, ISteamNetworkingSockets * sockets) = 0;
    285 | #endif
    286 | };
    287 | 
    288 | class GameServer::Connection : public zu::Counted
    289 | {
    290 |   public:
    291 |     virtual std::string const & playerName() const = 0;
    292 |     virtual std::string const & playerIdentity() const = 0;
    293 |     virtual std::string const & debugDescription() const = 0;
    294 |     virtual std::string const & playerData() const = 0;
    295 |     virtual zu::Ref<net::GSPlayerInfo> ubernetData() const = 0;
    296 | 
```

### .\libs\server\game_server.h:307
- Signature: L192:     virtual ~GameServer() { }
```cpp
    287 | 
    288 | class GameServer::Connection : public zu::Counted
    289 | {
    290 |   public:
    291 |     virtual std::string const & playerName() const = 0;
    292 |     virtual std::string const & playerIdentity() const = 0;
    293 |     virtual std::string const & debugDescription() const = 0;
    294 |     virtual std::string const & playerData() const = 0;
    295 |     virtual zu::Ref<net::GSPlayerInfo> ubernetData() const = 0;
    296 | 
    297 |     virtual bool connected() const = 0;
    298 | 
    299 |     virtual void setCheatsAllowed(bool value) = 0;
    300 | 
    301 |     virtual void setArmyControlBits(zu::BitVec const & bits) = 0;
    302 |     virtual void setArmyVisionBits(zu::BitVec const & bits) = 0;
    303 |     virtual zu::BitVec getArmyVisionBits() const = 0;
    304 | 
    305 |     virtual void sendMessage(zu::Json const & msg) = 0;
    306 |     virtual void sendMessage(std::string const & message) = 0;
>   307 |     virtual void sendModFileData(ModFileDataPackageBundle const & bundle, size_t estimated_size) = 0;
    308 | 
    309 |     virtual void close() = 0;
    310 | };
    311 | 
    312 | 
    313 | class GameServer::Driver
    314 | {
    315 |   protected:
    316 |     virtual ~Driver() { }
    317 | 
    318 |   public:
    319 | 
    320 |     virtual void newConnection(zu::RefNoCount<GameServer::Connection> connection) = 0;
    321 |     virtual void reconnected(zu::RefNoCount<GameServer::Connection> connection) = 0;
    322 |     virtual void disconnected(zu::RefNoCount<GameServer::Connection> connection) = 0;
    323 | 
    324 |     virtual void recvMessage(zu::RefNoCount<GameServer::Connection> connection, std::string const & msg) = 0;
    325 |     virtual void recvModFileData(zu::RefNoCount<GameServer::Connection> connection, ModFileDataPackageBundleAuthorized const & bundle_auth) = 0;
    326 | 
    327 |     virtual void createSimFinished(SimCreationMode mode) = 0;
```

### .\libs\server\game_server.h:325
- Signature: L316:     virtual ~Driver() { }
```cpp
    305 |     virtual void sendMessage(zu::Json const & msg) = 0;
    306 |     virtual void sendMessage(std::string const & message) = 0;
    307 |     virtual void sendModFileData(ModFileDataPackageBundle const & bundle, size_t estimated_size) = 0;
    308 | 
    309 |     virtual void close() = 0;
    310 | };
    311 | 
    312 | 
    313 | class GameServer::Driver
    314 | {
    315 |   protected:
    316 |     virtual ~Driver() { }
    317 | 
    318 |   public:
    319 | 
    320 |     virtual void newConnection(zu::RefNoCount<GameServer::Connection> connection) = 0;
    321 |     virtual void reconnected(zu::RefNoCount<GameServer::Connection> connection) = 0;
    322 |     virtual void disconnected(zu::RefNoCount<GameServer::Connection> connection) = 0;
    323 | 
    324 |     virtual void recvMessage(zu::RefNoCount<GameServer::Connection> connection, std::string const & msg) = 0;
>   325 |     virtual void recvModFileData(zu::RefNoCount<GameServer::Connection> connection, ModFileDataPackageBundleAuthorized const & bundle_auth) = 0;
    326 | 
    327 |     virtual void createSimFinished(SimCreationMode mode) = 0;
    328 |     virtual void simShutdownFinished() = 0;
    329 | 
    330 |     virtual void toggleNavDebug() = 0;
    331 |     virtual void initDropletTest(zu::Vec3f const & position) = 0;
    332 | 
    333 |     virtual bool mountContent(std::vector<std::string> const & contentList) = 0;
    334 | };
    335 | 
    336 | 
    337 | 
    338 | enum class SimThrottle { Disabled, Enabled };
    339 | 
    340 | GameServer * createGameServer(crom::Profiler & profiler,
    341 |                               zu::TaskQueue * background_task_pool,
    342 |                               crom::AsyncParallelForDriver * parallel_for,
    343 |                               net::UberNetGameServerService * ubernet,
    344 |                               crom::SpecLib * speclib,
    345 |                               net::SocketFactory * socket_factory,
```

### .\libs\server\server_module.cpp:475
- Signature: L467: void ServerModule::js_client_downloadModsFromServer(v8::FunctionCallbackInfo<v8::Value> const & info)
```cpp
    455 | 
    456 | void ServerModule::js_client_giveFullVision(v8::FunctionCallbackInfo<v8::Value> const & info)
    457 | {
    458 |     auto self = getSelf(info.Data());
    459 |     auto client = self->mClients->getElementSelf(info.This());
    460 |     if (!client || !client->connection)
    461 |         return;
    462 |     zu::BitVec bits;
    463 |     bits.oneFill(0, 99); // just an arbitrarily large number of army bits
    464 |     client->connection->setArmyVisionBits(bits);
    465 | }
    466 | 
    467 | void ServerModule::js_client_downloadModsFromServer(v8::FunctionCallbackInfo<v8::Value> const & info)
    468 | {
    469 |     auto self = getSelf(info.Data());
    470 |     auto client = self->mClients->getElementSelf(info.This());
    471 |     if (!client || !client->connection)
    472 |         return;
    473 | 
    474 |     // ###chargrove $TODO $OPENQUESTION does it have to be mounted by this point? is any loaded okay? not urgent, just something to think about for the long term
>   475 |     client->connection->sendModFileData(self->mHost->getServer()->getMountedModsDataPackageBundle(), self->mHost->getServer()->getMountedModsDataPackageBundleEstimatedSize());
    476 | }
    477 | 
    478 | void ServerModule::js_get_onConnect(v8::Local<v8::String> property, v8::PropertyCallbackInfo<v8::Value> const & info)
    479 | {
    480 |     auto self = getSelf(info.Data());
    481 |     info.GetReturnValue().Set(Local<Value>::New(self->mIsolate, self->mOnConnect));
    482 | }
    483 | 
    484 | void ServerModule::js_set_onConnect(v8::Local<v8::String> property, v8::Local<v8::Value> value, v8::PropertyCallbackInfo<void> const & info)
    485 | {
    486 |     auto self = getSelf(info.Data());
    487 |     self->mOnConnect.Reset(self->mIsolate, value);
    488 | }
    489 | 
    490 | void ServerModule::js_get_onLadderGameMarkedComplete(v8::Local<v8::String> property, v8::PropertyCallbackInfo<v8::Value> const & info)
    491 | {
    492 |     auto self = getSelf(info.Data());
    493 |     info.GetReturnValue().Set(Local<Value>::New(self->mIsolate, self->mOnLadderGameMarkedComplete));
    494 | }
    495 | 
```

### .\server\server_main.cpp:47
- Signature: Not found within 120 lines above match
```cpp
     27 | #endif
     28 | #include <engine/game/log_policy.h>
     29 | 
     30 | #include <engine/crom/canvas_stream.h>
     31 | #include <engine/crom/font.h>
     32 | #include <engine/crom/profiler.h>
     33 | #include <engine/crom/renderer.h>
     34 | #include <engine/crom/statspanel.h>
     35 | #include <engine/crom/papa_format.h>
     36 | #include <engine/crom/png_format.h>
     37 | #include <engine/crom/json_format.h>
     38 | #include <engine/crom/speclib.h>
     39 | #include <engine/crom/settings_db.h>
     40 | #include <engine/crom/nullren.h>
     41 | #include <engine/crom/console_command.h>
     42 | #include <engine/crom/crashhandler.h>
     43 | #include <engine/crom/gzip.h>
     44 | #include <engine/crom/texture_pool.h>
     45 | #include <engine/crom/memory_filesystem.h>
     46 | #include <engine/crom/mod_util.h>
>    47 | #include <engine/crom/mod_file_data_package_bundle_authorized.h>
     48 | 
     49 | #include <engine/zu/probe.h>
     50 | #include <engine/zu/json_util.h>
     51 | #include <engine/zu/alarmclock.h>
     52 | #include <engine/zu/poll.h>
     53 | #include <engine/zu/osutil.h>
     54 | #include <engine/zu/capture.h>
     55 | #include <engine/zu/version.h>
     56 | #include <engine/zu/uber_dump.h>
     57 | #include <engine/zu/uri.h>
     58 | #include <engine/zu/crash.h>
     59 | 
     60 | #include <engine/net/posix_socket.h>
     61 | #ifdef PLATFORM_WINDOWS
     62 | #include <engine/net/winsock_socket.h>
     63 | #endif
     64 | #include <engine/net/socket_logger.h>
     65 | #include <engine/net/msgpipe.h>
     66 | #include <engine/zu/message.h>
     67 | 
```

### .\server\server_main.cpp:2023
- Signature: L1997:     zu::Json readReplayFile(std::string const & replay_file_name)
```cpp
   2003 |         ZU_Info << "Loading replay file \"" << replay_file_name << "\"";
   2004 | 
   2005 |         zu::Timer time;
   2006 | 
   2007 |         std::ifstream replay_file;
   2008 | 
   2009 |         crom::osutil::openFile(replay_file, replay_file_name, std::ios_base::binary | std::ios_base::ate);
   2010 | 
   2011 |         if (!replay_file.good())
   2012 |         {
   2013 |             ZU_Error << "Error opening replay file";
   2014 |             requestExit();
   2015 |             return jsonResult;
   2016 |         }
   2017 | 
   2018 |         std::istream * replay_file_stream = &replay_file;
   2019 | 
   2020 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2021 |         std::string fourCC("    ");
   2022 | 
>  2023 |         uint8_t * uncompressed = nullptr;
   2024 | 
   2025 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2026 |         {
   2027 |             size_t compressed_size = replay_file.tellg();
   2028 | 
   2029 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2030 | 
   2031 |             if (compressed == nullptr)
   2032 |                 throw std::bad_alloc();
   2033 | 
   2034 |             replay_file.seekg(0);
   2035 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2036 |             replay_file.close();
   2037 | 
   2038 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2039 | 
   2040 |             ZU_FREE(compressed);
   2041 | 
   2042 |             if (uncompressed_size > 0)
   2043 |             {
```

### .\server\server_main.cpp:2027
- Signature: L1997:     zu::Json readReplayFile(std::string const & replay_file_name)
```cpp
   2007 |         std::ifstream replay_file;
   2008 | 
   2009 |         crom::osutil::openFile(replay_file, replay_file_name, std::ios_base::binary | std::ios_base::ate);
   2010 | 
   2011 |         if (!replay_file.good())
   2012 |         {
   2013 |             ZU_Error << "Error opening replay file";
   2014 |             requestExit();
   2015 |             return jsonResult;
   2016 |         }
   2017 | 
   2018 |         std::istream * replay_file_stream = &replay_file;
   2019 | 
   2020 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2021 |         std::string fourCC("    ");
   2022 | 
   2023 |         uint8_t * uncompressed = nullptr;
   2024 | 
   2025 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2026 |         {
>  2027 |             size_t compressed_size = replay_file.tellg();
   2028 | 
   2029 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2030 | 
   2031 |             if (compressed == nullptr)
   2032 |                 throw std::bad_alloc();
   2033 | 
   2034 |             replay_file.seekg(0);
   2035 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2036 |             replay_file.close();
   2037 | 
   2038 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2039 | 
   2040 |             ZU_FREE(compressed);
   2041 | 
   2042 |             if (uncompressed_size > 0)
   2043 |             {
   2044 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2045 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2046 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2047 |             }
```

### .\server\server_main.cpp:2029
- Signature: L1997:     zu::Json readReplayFile(std::string const & replay_file_name)
```cpp
   2009 |         crom::osutil::openFile(replay_file, replay_file_name, std::ios_base::binary | std::ios_base::ate);
   2010 | 
   2011 |         if (!replay_file.good())
   2012 |         {
   2013 |             ZU_Error << "Error opening replay file";
   2014 |             requestExit();
   2015 |             return jsonResult;
   2016 |         }
   2017 | 
   2018 |         std::istream * replay_file_stream = &replay_file;
   2019 | 
   2020 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2021 |         std::string fourCC("    ");
   2022 | 
   2023 |         uint8_t * uncompressed = nullptr;
   2024 | 
   2025 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2026 |         {
   2027 |             size_t compressed_size = replay_file.tellg();
   2028 | 
>  2029 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2030 | 
   2031 |             if (compressed == nullptr)
   2032 |                 throw std::bad_alloc();
   2033 | 
   2034 |             replay_file.seekg(0);
   2035 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2036 |             replay_file.close();
   2037 | 
   2038 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2039 | 
   2040 |             ZU_FREE(compressed);
   2041 | 
   2042 |             if (uncompressed_size > 0)
   2043 |             {
   2044 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2045 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2046 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2047 |             }
   2048 |         }
   2049 |         else
```

### .\server\server_main.cpp:2031
- Signature: L1997:     zu::Json readReplayFile(std::string const & replay_file_name)
```cpp
   2011 |         if (!replay_file.good())
   2012 |         {
   2013 |             ZU_Error << "Error opening replay file";
   2014 |             requestExit();
   2015 |             return jsonResult;
   2016 |         }
   2017 | 
   2018 |         std::istream * replay_file_stream = &replay_file;
   2019 | 
   2020 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2021 |         std::string fourCC("    ");
   2022 | 
   2023 |         uint8_t * uncompressed = nullptr;
   2024 | 
   2025 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2026 |         {
   2027 |             size_t compressed_size = replay_file.tellg();
   2028 | 
   2029 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2030 | 
>  2031 |             if (compressed == nullptr)
   2032 |                 throw std::bad_alloc();
   2033 | 
   2034 |             replay_file.seekg(0);
   2035 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2036 |             replay_file.close();
   2037 | 
   2038 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2039 | 
   2040 |             ZU_FREE(compressed);
   2041 | 
   2042 |             if (uncompressed_size > 0)
   2043 |             {
   2044 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2045 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2046 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2047 |             }
   2048 |         }
   2049 |         else
   2050 |         {
   2051 |             replay_file.seekg(0);
```

### .\server\server_main.cpp:2035
- Signature: L1997:     zu::Json readReplayFile(std::string const & replay_file_name)
```cpp
   2015 |             return jsonResult;
   2016 |         }
   2017 | 
   2018 |         std::istream * replay_file_stream = &replay_file;
   2019 | 
   2020 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2021 |         std::string fourCC("    ");
   2022 | 
   2023 |         uint8_t * uncompressed = nullptr;
   2024 | 
   2025 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2026 |         {
   2027 |             size_t compressed_size = replay_file.tellg();
   2028 | 
   2029 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2030 | 
   2031 |             if (compressed == nullptr)
   2032 |                 throw std::bad_alloc();
   2033 | 
   2034 |             replay_file.seekg(0);
>  2035 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2036 |             replay_file.close();
   2037 | 
   2038 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2039 | 
   2040 |             ZU_FREE(compressed);
   2041 | 
   2042 |             if (uncompressed_size > 0)
   2043 |             {
   2044 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2045 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2046 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2047 |             }
   2048 |         }
   2049 |         else
   2050 |         {
   2051 |             replay_file.seekg(0);
   2052 |             replay_file_stream->read(fourCC.data(), 4);
   2053 |             replay_msg_pipe.reset(new netutil::IStreamMsgPipe(*replay_file_stream));
   2054 |         }
   2055 | 
```

### .\server\server_main.cpp:2038
- Signature: L1997:     zu::Json readReplayFile(std::string const & replay_file_name)
```cpp
   2018 |         std::istream * replay_file_stream = &replay_file;
   2019 | 
   2020 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2021 |         std::string fourCC("    ");
   2022 | 
   2023 |         uint8_t * uncompressed = nullptr;
   2024 | 
   2025 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2026 |         {
   2027 |             size_t compressed_size = replay_file.tellg();
   2028 | 
   2029 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2030 | 
   2031 |             if (compressed == nullptr)
   2032 |                 throw std::bad_alloc();
   2033 | 
   2034 |             replay_file.seekg(0);
   2035 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2036 |             replay_file.close();
   2037 | 
>  2038 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2039 | 
   2040 |             ZU_FREE(compressed);
   2041 | 
   2042 |             if (uncompressed_size > 0)
   2043 |             {
   2044 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2045 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2046 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2047 |             }
   2048 |         }
   2049 |         else
   2050 |         {
   2051 |             replay_file.seekg(0);
   2052 |             replay_file_stream->read(fourCC.data(), 4);
   2053 |             replay_msg_pipe.reset(new netutil::IStreamMsgPipe(*replay_file_stream));
   2054 |         }
   2055 | 
   2056 |         netutil::UberProtoPipe upPipe(replay_msg_pipe.get());
   2057 | 
   2058 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
```

### .\server\server_main.cpp:2040
- Signature: L1997:     zu::Json readReplayFile(std::string const & replay_file_name)
```cpp
   2020 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2021 |         std::string fourCC("    ");
   2022 | 
   2023 |         uint8_t * uncompressed = nullptr;
   2024 | 
   2025 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2026 |         {
   2027 |             size_t compressed_size = replay_file.tellg();
   2028 | 
   2029 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2030 | 
   2031 |             if (compressed == nullptr)
   2032 |                 throw std::bad_alloc();
   2033 | 
   2034 |             replay_file.seekg(0);
   2035 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2036 |             replay_file.close();
   2037 | 
   2038 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2039 | 
>  2040 |             ZU_FREE(compressed);
   2041 | 
   2042 |             if (uncompressed_size > 0)
   2043 |             {
   2044 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2045 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2046 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2047 |             }
   2048 |         }
   2049 |         else
   2050 |         {
   2051 |             replay_file.seekg(0);
   2052 |             replay_file_stream->read(fourCC.data(), 4);
   2053 |             replay_msg_pipe.reset(new netutil::IStreamMsgPipe(*replay_file_stream));
   2054 |         }
   2055 | 
   2056 |         netutil::UberProtoPipe upPipe(replay_msg_pipe.get());
   2057 | 
   2058 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
   2059 |         {
   2060 |             ZU_Error << "Error loading replay: Unknown driver replay version encountered";
```

### .\server\server_main.cpp:2042
- Signature: L1997:     zu::Json readReplayFile(std::string const & replay_file_name)
```cpp
   2022 | 
   2023 |         uint8_t * uncompressed = nullptr;
   2024 | 
   2025 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2026 |         {
   2027 |             size_t compressed_size = replay_file.tellg();
   2028 | 
   2029 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2030 | 
   2031 |             if (compressed == nullptr)
   2032 |                 throw std::bad_alloc();
   2033 | 
   2034 |             replay_file.seekg(0);
   2035 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2036 |             replay_file.close();
   2037 | 
   2038 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2039 | 
   2040 |             ZU_FREE(compressed);
   2041 | 
>  2042 |             if (uncompressed_size > 0)
   2043 |             {
   2044 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2045 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2046 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2047 |             }
   2048 |         }
   2049 |         else
   2050 |         {
   2051 |             replay_file.seekg(0);
   2052 |             replay_file_stream->read(fourCC.data(), 4);
   2053 |             replay_msg_pipe.reset(new netutil::IStreamMsgPipe(*replay_file_stream));
   2054 |         }
   2055 | 
   2056 |         netutil::UberProtoPipe upPipe(replay_msg_pipe.get());
   2057 | 
   2058 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
   2059 |         {
   2060 |             ZU_Error << "Error loading replay: Unknown driver replay version encountered";
   2061 |             requestExit();
   2062 |         }
```

### .\server\server_main.cpp:2044
- Signature: L1997:     zu::Json readReplayFile(std::string const & replay_file_name)
```cpp
   2024 | 
   2025 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2026 |         {
   2027 |             size_t compressed_size = replay_file.tellg();
   2028 | 
   2029 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2030 | 
   2031 |             if (compressed == nullptr)
   2032 |                 throw std::bad_alloc();
   2033 | 
   2034 |             replay_file.seekg(0);
   2035 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2036 |             replay_file.close();
   2037 | 
   2038 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2039 | 
   2040 |             ZU_FREE(compressed);
   2041 | 
   2042 |             if (uncompressed_size > 0)
   2043 |             {
>  2044 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2045 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2046 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2047 |             }
   2048 |         }
   2049 |         else
   2050 |         {
   2051 |             replay_file.seekg(0);
   2052 |             replay_file_stream->read(fourCC.data(), 4);
   2053 |             replay_msg_pipe.reset(new netutil::IStreamMsgPipe(*replay_file_stream));
   2054 |         }
   2055 | 
   2056 |         netutil::UberProtoPipe upPipe(replay_msg_pipe.get());
   2057 | 
   2058 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
   2059 |         {
   2060 |             ZU_Error << "Error loading replay: Unknown driver replay version encountered";
   2061 |             requestExit();
   2062 |         }
   2063 |         else if (mGameServer->loadReplay(upPipe, jsonResult))
   2064 |         {
```

### .\server\server_main.cpp:2073
- Signature: L2063:         else if (mGameServer->loadReplay(upPipe, jsonResult))
```cpp
   2053 |             replay_msg_pipe.reset(new netutil::IStreamMsgPipe(*replay_file_stream));
   2054 |         }
   2055 | 
   2056 |         netutil::UberProtoPipe upPipe(replay_msg_pipe.get());
   2057 | 
   2058 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
   2059 |         {
   2060 |             ZU_Error << "Error loading replay: Unknown driver replay version encountered";
   2061 |             requestExit();
   2062 |         }
   2063 |         else if (mGameServer->loadReplay(upPipe, jsonResult))
   2064 |         {
   2065 |             ZU_Info << "Replay file read in " << time.elapsedMilliseconds() << "ms";
   2066 |         }
   2067 |         else
   2068 |         {
   2069 |             ZU_Error << "Error loading replay";
   2070 |             requestExit();
   2071 |         }
   2072 | 
>  2073 |         if (uncompressed)
   2074 |         {
   2075 |             ZU_FREE(uncompressed);
   2076 |             uncompressed = nullptr;
   2077 |         }
   2078 | 
   2079 |         return jsonResult;
   2080 |     }
   2081 | 
   2082 |     void writeReplayFile(std::string const & replayFileName, std::string const & saveName, std::string const & type)
   2083 |     {
   2084 |         ScopedLock lock(mMutex);
   2085 |         writeReplayFile(lock, replayFileName, saveName, type);
   2086 |     }
   2087 | 
   2088 |     void writeReplayFile(ScopedLock & lock, std::string const & replayFileName, std::string const & saveName, std::string const & type)
   2089 |     {
   2090 |         if (!cmdline_outputDir.isSet())
   2091 |             return;
   2092 | 
   2093 |         if (!mWriteReplayEnabled)
```

### .\server\server_main.cpp:2075
- Signature: L2063:         else if (mGameServer->loadReplay(upPipe, jsonResult))
```cpp
   2055 | 
   2056 |         netutil::UberProtoPipe upPipe(replay_msg_pipe.get());
   2057 | 
   2058 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
   2059 |         {
   2060 |             ZU_Error << "Error loading replay: Unknown driver replay version encountered";
   2061 |             requestExit();
   2062 |         }
   2063 |         else if (mGameServer->loadReplay(upPipe, jsonResult))
   2064 |         {
   2065 |             ZU_Info << "Replay file read in " << time.elapsedMilliseconds() << "ms";
   2066 |         }
   2067 |         else
   2068 |         {
   2069 |             ZU_Error << "Error loading replay";
   2070 |             requestExit();
   2071 |         }
   2072 | 
   2073 |         if (uncompressed)
   2074 |         {
>  2075 |             ZU_FREE(uncompressed);
   2076 |             uncompressed = nullptr;
   2077 |         }
   2078 | 
   2079 |         return jsonResult;
   2080 |     }
   2081 | 
   2082 |     void writeReplayFile(std::string const & replayFileName, std::string const & saveName, std::string const & type)
   2083 |     {
   2084 |         ScopedLock lock(mMutex);
   2085 |         writeReplayFile(lock, replayFileName, saveName, type);
   2086 |     }
   2087 | 
   2088 |     void writeReplayFile(ScopedLock & lock, std::string const & replayFileName, std::string const & saveName, std::string const & type)
   2089 |     {
   2090 |         if (!cmdline_outputDir.isSet())
   2091 |             return;
   2092 | 
   2093 |         if (!mWriteReplayEnabled)
   2094 |         {
   2095 |             ZU_Info << "Skipping write of replay file; explicitly disabled";
```

### .\server\server_main.cpp:2076
- Signature: L2063:         else if (mGameServer->loadReplay(upPipe, jsonResult))
```cpp
   2056 |         netutil::UberProtoPipe upPipe(replay_msg_pipe.get());
   2057 | 
   2058 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
   2059 |         {
   2060 |             ZU_Error << "Error loading replay: Unknown driver replay version encountered";
   2061 |             requestExit();
   2062 |         }
   2063 |         else if (mGameServer->loadReplay(upPipe, jsonResult))
   2064 |         {
   2065 |             ZU_Info << "Replay file read in " << time.elapsedMilliseconds() << "ms";
   2066 |         }
   2067 |         else
   2068 |         {
   2069 |             ZU_Error << "Error loading replay";
   2070 |             requestExit();
   2071 |         }
   2072 | 
   2073 |         if (uncompressed)
   2074 |         {
   2075 |             ZU_FREE(uncompressed);
>  2076 |             uncompressed = nullptr;
   2077 |         }
   2078 | 
   2079 |         return jsonResult;
   2080 |     }
   2081 | 
   2082 |     void writeReplayFile(std::string const & replayFileName, std::string const & saveName, std::string const & type)
   2083 |     {
   2084 |         ScopedLock lock(mMutex);
   2085 |         writeReplayFile(lock, replayFileName, saveName, type);
   2086 |     }
   2087 | 
   2088 |     void writeReplayFile(ScopedLock & lock, std::string const & replayFileName, std::string const & saveName, std::string const & type)
   2089 |     {
   2090 |         if (!cmdline_outputDir.isSet())
   2091 |             return;
   2092 | 
   2093 |         if (!mWriteReplayEnabled)
   2094 |         {
   2095 |             ZU_Info << "Skipping write of replay file; explicitly disabled";
   2096 |             return;
```

### .\server\server_main.cpp:2135
- Signature: L2105:         else if (save)
```cpp
   2115 |         replay_file_name = path::join(path, replay_file_name);
   2116 | 
   2117 |         ZU_Info << "Writing replay file " << replay_file_name;
   2118 |         zu::Timer time;
   2119 | 
   2120 |         std::ofstream replay_file;
   2121 |         crom::osutil::openFile(replay_file, replay_file_name, std::ios_base::binary | std::ios_base::trunc);
   2122 |         replay_file.flush();
   2123 | 
   2124 |         if (!replay_file.good())
   2125 |         {
   2126 |             ZU_Error << "Error creating file";
   2127 |             return;
   2128 |         }
   2129 | 
   2130 |         std::function<void(uint8_t const * bytes, size_t size)> callback = [&replay_file](uint8_t const * bytes, size_t size)
   2131 |         {
   2132 |             replay_file.write(reinterpret_cast<char const *>(bytes), size);
   2133 |         };
   2134 | 
>  2135 |         std::unique_ptr<GZipCompressor> compressor(GZipCompressor::createCompressor(callback));
   2136 |         compressor->write(reinterpret_cast<uint8_t *>(SERVER_DRIVER_REPLAY_FOURCC.data()), 4);
   2137 | 
   2138 |         // ### Crazy gross hack alert!  GameServer::writeReplay()
   2139 |         // ### isn't handling threading correctly, so we need to
   2140 |         // ### sync the sim thread to make sure it doesn't crash.
   2141 |         // ### If we weren't a couple weeks from ship, I would
   2142 |         // ### never check this in.  But oh well. --wlott 8/13/14
   2143 |         mGameServer->simSync();
   2144 | 
   2145 |         netutil::GzipWriteMsgPipe filePipe(compressor);
   2146 |         netutil::UberProtoPipe upPipe(&filePipe);
   2147 | 
   2148 |         zu::Json info = Json::makeObject();
   2149 | 
   2150 |         if (save)
   2151 |         {
   2152 |             // we actually want this save info from the sim module in the info json and replay header so that the loadSave check for valid load times actually works
   2153 | 
   2154 |             Json save_data = mSimModuleHost.getModule()->saveInfo();
   2155 |             save_data.set("name", zu::Json::makeString(saveName));
```

### .\server\server_main.cpp:2136
- Signature: L2105:         else if (save)
```cpp
   2116 | 
   2117 |         ZU_Info << "Writing replay file " << replay_file_name;
   2118 |         zu::Timer time;
   2119 | 
   2120 |         std::ofstream replay_file;
   2121 |         crom::osutil::openFile(replay_file, replay_file_name, std::ios_base::binary | std::ios_base::trunc);
   2122 |         replay_file.flush();
   2123 | 
   2124 |         if (!replay_file.good())
   2125 |         {
   2126 |             ZU_Error << "Error creating file";
   2127 |             return;
   2128 |         }
   2129 | 
   2130 |         std::function<void(uint8_t const * bytes, size_t size)> callback = [&replay_file](uint8_t const * bytes, size_t size)
   2131 |         {
   2132 |             replay_file.write(reinterpret_cast<char const *>(bytes), size);
   2133 |         };
   2134 | 
   2135 |         std::unique_ptr<GZipCompressor> compressor(GZipCompressor::createCompressor(callback));
>  2136 |         compressor->write(reinterpret_cast<uint8_t *>(SERVER_DRIVER_REPLAY_FOURCC.data()), 4);
   2137 | 
   2138 |         // ### Crazy gross hack alert!  GameServer::writeReplay()
   2139 |         // ### isn't handling threading correctly, so we need to
   2140 |         // ### sync the sim thread to make sure it doesn't crash.
   2141 |         // ### If we weren't a couple weeks from ship, I would
   2142 |         // ### never check this in.  But oh well. --wlott 8/13/14
   2143 |         mGameServer->simSync();
   2144 | 
   2145 |         netutil::GzipWriteMsgPipe filePipe(compressor);
   2146 |         netutil::UberProtoPipe upPipe(&filePipe);
   2147 | 
   2148 |         zu::Json info = Json::makeObject();
   2149 | 
   2150 |         if (save)
   2151 |         {
   2152 |             // we actually want this save info from the sim module in the info json and replay header so that the loadSave check for valid load times actually works
   2153 | 
   2154 |             Json save_data = mSimModuleHost.getModule()->saveInfo();
   2155 |             save_data.set("name", zu::Json::makeString(saveName));
   2156 |             save_data.set("type", zu::Json::makeString(type));
```

### .\server\server_main.cpp:2145
- Signature: L2105:         else if (save)
```cpp
   2125 |         {
   2126 |             ZU_Error << "Error creating file";
   2127 |             return;
   2128 |         }
   2129 | 
   2130 |         std::function<void(uint8_t const * bytes, size_t size)> callback = [&replay_file](uint8_t const * bytes, size_t size)
   2131 |         {
   2132 |             replay_file.write(reinterpret_cast<char const *>(bytes), size);
   2133 |         };
   2134 | 
   2135 |         std::unique_ptr<GZipCompressor> compressor(GZipCompressor::createCompressor(callback));
   2136 |         compressor->write(reinterpret_cast<uint8_t *>(SERVER_DRIVER_REPLAY_FOURCC.data()), 4);
   2137 | 
   2138 |         // ### Crazy gross hack alert!  GameServer::writeReplay()
   2139 |         // ### isn't handling threading correctly, so we need to
   2140 |         // ### sync the sim thread to make sure it doesn't crash.
   2141 |         // ### If we weren't a couple weeks from ship, I would
   2142 |         // ### never check this in.  But oh well. --wlott 8/13/14
   2143 |         mGameServer->simSync();
   2144 | 
>  2145 |         netutil::GzipWriteMsgPipe filePipe(compressor);
   2146 |         netutil::UberProtoPipe upPipe(&filePipe);
   2147 | 
   2148 |         zu::Json info = Json::makeObject();
   2149 | 
   2150 |         if (save)
   2151 |         {
   2152 |             // we actually want this save info from the sim module in the info json and replay header so that the loadSave check for valid load times actually works
   2153 | 
   2154 |             Json save_data = mSimModuleHost.getModule()->saveInfo();
   2155 |             save_data.set("name", zu::Json::makeString(saveName));
   2156 |             save_data.set("type", zu::Json::makeString(type));
   2157 |             info.set("save", save_data);
   2158 |         }
   2159 | 
   2160 |         bool replay_ok = mGameServer->writeReplay(upPipe, info);
   2161 |         if (replay_ok)
   2162 |             replay_ok = mSimModuleHost.getModule()->writeReplay(upPipe, info);
   2163 | 
   2164 |         compressor->finish();
   2165 | 
```

### .\server\server_main.cpp:2164
- Signature: L2105:         else if (save)
```cpp
   2144 | 
   2145 |         netutil::GzipWriteMsgPipe filePipe(compressor);
   2146 |         netutil::UberProtoPipe upPipe(&filePipe);
   2147 | 
   2148 |         zu::Json info = Json::makeObject();
   2149 | 
   2150 |         if (save)
   2151 |         {
   2152 |             // we actually want this save info from the sim module in the info json and replay header so that the loadSave check for valid load times actually works
   2153 | 
   2154 |             Json save_data = mSimModuleHost.getModule()->saveInfo();
   2155 |             save_data.set("name", zu::Json::makeString(saveName));
   2156 |             save_data.set("type", zu::Json::makeString(type));
   2157 |             info.set("save", save_data);
   2158 |         }
   2159 | 
   2160 |         bool replay_ok = mGameServer->writeReplay(upPipe, info);
   2161 |         if (replay_ok)
   2162 |             replay_ok = mSimModuleHost.getModule()->writeReplay(upPipe, info);
   2163 | 
>  2164 |         compressor->finish();
   2165 | 
   2166 |         replay_file.close();
   2167 |         ZU_Info << "Replay file written in " << time.elapsedMilliseconds() << "ms";
   2168 | 
   2169 |         if (replay_ok && info.isObject())
   2170 |         {
   2171 |             // write out the info json blob (from the replay header) to a separate file, for ubernet replay browsing purposes
   2172 |             std::ofstream replay_info_json_file;
   2173 |             crom::osutil::openFile(replay_info_json_file, path::sansExt(replay_file_name).toString() + ".info.json", std::ios_base::trunc);
   2174 |             replay_info_json_file << JsonIndent(info, 4);
   2175 |             replay_info_json_file.flush();
   2176 |             replay_info_json_file.close();
   2177 |         }
   2178 |         else
   2179 |         {
   2180 |             ZU_Error << "Error writing replay or header JSON";
   2181 |             zu::osutil::deleteFile(replay_file_name.c_str());
   2182 |         }
   2183 |     }
   2184 | 
```

### .\server\server_main.cpp:2208
- Signature: L2185:     Json loadSave(std::string const & replay_file_name, float load_time)
```cpp
   2188 | 
   2189 |         ZU_Info << "Loading save file \"" << replay_file_name << "\" at " << load_time;
   2190 | 
   2191 |         zu::Timer time;
   2192 | 
   2193 |         std::ifstream replay_file;
   2194 | 
   2195 |         crom::osutil::openFile(replay_file, replay_file_name, std::ios_base::binary | std::ios_base::ate);
   2196 | 
   2197 |         if (!replay_file.good())
   2198 |         {
   2199 |             ZU_Error << "Error opening replay file";
   2200 |             requestExit();
   2201 |             return jsonResult;
   2202 |         }
   2203 | 
   2204 |         std::istream * replay_file_stream = &replay_file;
   2205 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2206 |         std::string fourCC("    ");
   2207 | 
>  2208 |         uint8_t * uncompressed = nullptr;
   2209 | 
   2210 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2211 |         {
   2212 |             size_t compressed_size = replay_file.tellg();
   2213 | 
   2214 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2215 | 
   2216 |             if (compressed == nullptr)
   2217 |                 throw std::bad_alloc();
   2218 | 
   2219 |             replay_file.seekg(0);
   2220 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2221 |             replay_file.close();
   2222 | 
   2223 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2224 | 
   2225 |             ZU_FREE(compressed);
   2226 | 
   2227 |             if (uncompressed_size > 0)
   2228 |             {
```

### .\server\server_main.cpp:2212
- Signature: L2185:     Json loadSave(std::string const & replay_file_name, float load_time)
```cpp
   2192 | 
   2193 |         std::ifstream replay_file;
   2194 | 
   2195 |         crom::osutil::openFile(replay_file, replay_file_name, std::ios_base::binary | std::ios_base::ate);
   2196 | 
   2197 |         if (!replay_file.good())
   2198 |         {
   2199 |             ZU_Error << "Error opening replay file";
   2200 |             requestExit();
   2201 |             return jsonResult;
   2202 |         }
   2203 | 
   2204 |         std::istream * replay_file_stream = &replay_file;
   2205 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2206 |         std::string fourCC("    ");
   2207 | 
   2208 |         uint8_t * uncompressed = nullptr;
   2209 | 
   2210 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2211 |         {
>  2212 |             size_t compressed_size = replay_file.tellg();
   2213 | 
   2214 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2215 | 
   2216 |             if (compressed == nullptr)
   2217 |                 throw std::bad_alloc();
   2218 | 
   2219 |             replay_file.seekg(0);
   2220 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2221 |             replay_file.close();
   2222 | 
   2223 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2224 | 
   2225 |             ZU_FREE(compressed);
   2226 | 
   2227 |             if (uncompressed_size > 0)
   2228 |             {
   2229 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2230 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2231 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2232 |             }
```

### .\server\server_main.cpp:2214
- Signature: L2185:     Json loadSave(std::string const & replay_file_name, float load_time)
```cpp
   2194 | 
   2195 |         crom::osutil::openFile(replay_file, replay_file_name, std::ios_base::binary | std::ios_base::ate);
   2196 | 
   2197 |         if (!replay_file.good())
   2198 |         {
   2199 |             ZU_Error << "Error opening replay file";
   2200 |             requestExit();
   2201 |             return jsonResult;
   2202 |         }
   2203 | 
   2204 |         std::istream * replay_file_stream = &replay_file;
   2205 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2206 |         std::string fourCC("    ");
   2207 | 
   2208 |         uint8_t * uncompressed = nullptr;
   2209 | 
   2210 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2211 |         {
   2212 |             size_t compressed_size = replay_file.tellg();
   2213 | 
>  2214 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2215 | 
   2216 |             if (compressed == nullptr)
   2217 |                 throw std::bad_alloc();
   2218 | 
   2219 |             replay_file.seekg(0);
   2220 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2221 |             replay_file.close();
   2222 | 
   2223 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2224 | 
   2225 |             ZU_FREE(compressed);
   2226 | 
   2227 |             if (uncompressed_size > 0)
   2228 |             {
   2229 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2230 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2231 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2232 |             }
   2233 |         }
   2234 |         else
```

### .\server\server_main.cpp:2216
- Signature: L2185:     Json loadSave(std::string const & replay_file_name, float load_time)
```cpp
   2196 | 
   2197 |         if (!replay_file.good())
   2198 |         {
   2199 |             ZU_Error << "Error opening replay file";
   2200 |             requestExit();
   2201 |             return jsonResult;
   2202 |         }
   2203 | 
   2204 |         std::istream * replay_file_stream = &replay_file;
   2205 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2206 |         std::string fourCC("    ");
   2207 | 
   2208 |         uint8_t * uncompressed = nullptr;
   2209 | 
   2210 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2211 |         {
   2212 |             size_t compressed_size = replay_file.tellg();
   2213 | 
   2214 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2215 | 
>  2216 |             if (compressed == nullptr)
   2217 |                 throw std::bad_alloc();
   2218 | 
   2219 |             replay_file.seekg(0);
   2220 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2221 |             replay_file.close();
   2222 | 
   2223 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2224 | 
   2225 |             ZU_FREE(compressed);
   2226 | 
   2227 |             if (uncompressed_size > 0)
   2228 |             {
   2229 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2230 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2231 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2232 |             }
   2233 |         }
   2234 |         else
   2235 |         {
   2236 |             replay_file.seekg(0);
```

### .\server\server_main.cpp:2220
- Signature: L2185:     Json loadSave(std::string const & replay_file_name, float load_time)
```cpp
   2200 |             requestExit();
   2201 |             return jsonResult;
   2202 |         }
   2203 | 
   2204 |         std::istream * replay_file_stream = &replay_file;
   2205 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2206 |         std::string fourCC("    ");
   2207 | 
   2208 |         uint8_t * uncompressed = nullptr;
   2209 | 
   2210 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2211 |         {
   2212 |             size_t compressed_size = replay_file.tellg();
   2213 | 
   2214 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2215 | 
   2216 |             if (compressed == nullptr)
   2217 |                 throw std::bad_alloc();
   2218 | 
   2219 |             replay_file.seekg(0);
>  2220 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2221 |             replay_file.close();
   2222 | 
   2223 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2224 | 
   2225 |             ZU_FREE(compressed);
   2226 | 
   2227 |             if (uncompressed_size > 0)
   2228 |             {
   2229 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2230 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2231 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2232 |             }
   2233 |         }
   2234 |         else
   2235 |         {
   2236 |             replay_file.seekg(0);
   2237 |             replay_file_stream->read(fourCC.data(), 4);
   2238 |             replay_msg_pipe.reset(new netutil::IStreamMsgPipe(*replay_file_stream));
   2239 |         }
   2240 | 
```

### .\server\server_main.cpp:2223
- Signature: L2185:     Json loadSave(std::string const & replay_file_name, float load_time)
```cpp
   2203 | 
   2204 |         std::istream * replay_file_stream = &replay_file;
   2205 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2206 |         std::string fourCC("    ");
   2207 | 
   2208 |         uint8_t * uncompressed = nullptr;
   2209 | 
   2210 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2211 |         {
   2212 |             size_t compressed_size = replay_file.tellg();
   2213 | 
   2214 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2215 | 
   2216 |             if (compressed == nullptr)
   2217 |                 throw std::bad_alloc();
   2218 | 
   2219 |             replay_file.seekg(0);
   2220 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2221 |             replay_file.close();
   2222 | 
>  2223 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2224 | 
   2225 |             ZU_FREE(compressed);
   2226 | 
   2227 |             if (uncompressed_size > 0)
   2228 |             {
   2229 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2230 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2231 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2232 |             }
   2233 |         }
   2234 |         else
   2235 |         {
   2236 |             replay_file.seekg(0);
   2237 |             replay_file_stream->read(fourCC.data(), 4);
   2238 |             replay_msg_pipe.reset(new netutil::IStreamMsgPipe(*replay_file_stream));
   2239 |         }
   2240 | 
   2241 |         netutil::UberProtoPipe upPipe(replay_msg_pipe.get());
   2242 | 
   2243 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
```

### .\server\server_main.cpp:2225
- Signature: L2185:     Json loadSave(std::string const & replay_file_name, float load_time)
```cpp
   2205 |         std::shared_ptr<net::MsgPipe> replay_msg_pipe;
   2206 |         std::string fourCC("    ");
   2207 | 
   2208 |         uint8_t * uncompressed = nullptr;
   2209 | 
   2210 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2211 |         {
   2212 |             size_t compressed_size = replay_file.tellg();
   2213 | 
   2214 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2215 | 
   2216 |             if (compressed == nullptr)
   2217 |                 throw std::bad_alloc();
   2218 | 
   2219 |             replay_file.seekg(0);
   2220 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2221 |             replay_file.close();
   2222 | 
   2223 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2224 | 
>  2225 |             ZU_FREE(compressed);
   2226 | 
   2227 |             if (uncompressed_size > 0)
   2228 |             {
   2229 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2230 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2231 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2232 |             }
   2233 |         }
   2234 |         else
   2235 |         {
   2236 |             replay_file.seekg(0);
   2237 |             replay_file_stream->read(fourCC.data(), 4);
   2238 |             replay_msg_pipe.reset(new netutil::IStreamMsgPipe(*replay_file_stream));
   2239 |         }
   2240 | 
   2241 |         netutil::UberProtoPipe upPipe(replay_msg_pipe.get());
   2242 | 
   2243 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
   2244 |         {
   2245 |             ZU_Error << "Error loading save: Unknown driver replay version encountered";
```

### .\server\server_main.cpp:2227
- Signature: L2185:     Json loadSave(std::string const & replay_file_name, float load_time)
```cpp
   2207 | 
   2208 |         uint8_t * uncompressed = nullptr;
   2209 | 
   2210 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2211 |         {
   2212 |             size_t compressed_size = replay_file.tellg();
   2213 | 
   2214 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2215 | 
   2216 |             if (compressed == nullptr)
   2217 |                 throw std::bad_alloc();
   2218 | 
   2219 |             replay_file.seekg(0);
   2220 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2221 |             replay_file.close();
   2222 | 
   2223 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2224 | 
   2225 |             ZU_FREE(compressed);
   2226 | 
>  2227 |             if (uncompressed_size > 0)
   2228 |             {
   2229 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2230 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2231 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2232 |             }
   2233 |         }
   2234 |         else
   2235 |         {
   2236 |             replay_file.seekg(0);
   2237 |             replay_file_stream->read(fourCC.data(), 4);
   2238 |             replay_msg_pipe.reset(new netutil::IStreamMsgPipe(*replay_file_stream));
   2239 |         }
   2240 | 
   2241 |         netutil::UberProtoPipe upPipe(replay_msg_pipe.get());
   2242 | 
   2243 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
   2244 |         {
   2245 |             ZU_Error << "Error loading save: Unknown driver replay version encountered";
   2246 |             requestExit();
   2247 |         }
```

### .\server\server_main.cpp:2229
- Signature: L2185:     Json loadSave(std::string const & replay_file_name, float load_time)
```cpp
   2209 | 
   2210 |         if (StringRange(replay_file_name).endsWithNoCase(".par.gz"))
   2211 |         {
   2212 |             size_t compressed_size = replay_file.tellg();
   2213 | 
   2214 |             uint8_t * compressed = reinterpret_cast<uint8_t *>(ZU_MALLOC(compressed_size));
   2215 | 
   2216 |             if (compressed == nullptr)
   2217 |                 throw std::bad_alloc();
   2218 | 
   2219 |             replay_file.seekg(0);
   2220 |             replay_file.read(reinterpret_cast<char *>(compressed), compressed_size);
   2221 |             replay_file.close();
   2222 | 
   2223 |             size_t uncompressed_size = crom::gunzip(compressed, compressed_size, uncompressed, 0);
   2224 | 
   2225 |             ZU_FREE(compressed);
   2226 | 
   2227 |             if (uncompressed_size > 0)
   2228 |             {
>  2229 |                 MemoryBufferReadMsgPipe * memory_buffer_msg_pipe = new MemoryBufferReadMsgPipe(uncompressed, uncompressed_size);
   2230 |                 memory_buffer_msg_pipe->readBytes(reinterpret_cast<uint8_t *>(fourCC.data()), 4);
   2231 |                 replay_msg_pipe.reset(memory_buffer_msg_pipe);
   2232 |             }
   2233 |         }
   2234 |         else
   2235 |         {
   2236 |             replay_file.seekg(0);
   2237 |             replay_file_stream->read(fourCC.data(), 4);
   2238 |             replay_msg_pipe.reset(new netutil::IStreamMsgPipe(*replay_file_stream));
   2239 |         }
   2240 | 
   2241 |         netutil::UberProtoPipe upPipe(replay_msg_pipe.get());
   2242 | 
   2243 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
   2244 |         {
   2245 |             ZU_Error << "Error loading save: Unknown driver replay version encountered";
   2246 |             requestExit();
   2247 |         }
   2248 |         else if (!mGameServer->loadSave(upPipe, load_time, jsonResult))
   2249 |         {
```

### .\server\server_main.cpp:2261
- Signature: L2253:         else if (!mSimModuleHost.getModule()->loadSave(upPipe))
```cpp
   2241 |         netutil::UberProtoPipe upPipe(replay_msg_pipe.get());
   2242 | 
   2243 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
   2244 |         {
   2245 |             ZU_Error << "Error loading save: Unknown driver replay version encountered";
   2246 |             requestExit();
   2247 |         }
   2248 |         else if (!mGameServer->loadSave(upPipe, load_time, jsonResult))
   2249 |         {
   2250 |             ZU_Error << "Error loading save: mGamerServer->loadSave failed";
   2251 |             requestExit();
   2252 |         }
   2253 |         else if (!mSimModuleHost.getModule()->loadSave(upPipe))
   2254 |         {
   2255 |             ZU_Error << "Error loading save: simModule->loadSave failed";
   2256 |             ZU_Error << "... This is a known issue with older replays. If we are just viewing a replay, nothing bad will happen.";
   2257 |             ZU_Error << "... If we attempt to resume, the game will not end correctly and surrender will not work.";
   2258 |             /* TODO: prevent resume if the module was could not load from the save.  indicate in the UI that resume will not work with this file. */
   2259 |         }
   2260 | 
>  2261 |         if (uncompressed)
   2262 |         {
   2263 |             ZU_FREE(uncompressed);
   2264 |             uncompressed = nullptr;
   2265 |         }
   2266 | 
   2267 |         return jsonResult;
   2268 |     }
   2269 | 
   2270 |     void createSimFromReplay()
   2271 |     {
   2272 |         mGameServer->createSimFromReplay();
   2273 |     }
   2274 | 
   2275 |     void trimHistoryAndStartSim(float load_time_in_seconds)
   2276 |     {
   2277 |         mGameServer->trimHistoryAndStartSim(load_time_in_seconds);
   2278 |     }
   2279 | 
   2280 |     virtual void update(float dt) override
   2281 |     {
```

### .\server\server_main.cpp:2263
- Signature: L2253:         else if (!mSimModuleHost.getModule()->loadSave(upPipe))
```cpp
   2243 |         if (fourCC != SERVER_DRIVER_REPLAY_FOURCC)
   2244 |         {
   2245 |             ZU_Error << "Error loading save: Unknown driver replay version encountered";
   2246 |             requestExit();
   2247 |         }
   2248 |         else if (!mGameServer->loadSave(upPipe, load_time, jsonResult))
   2249 |         {
   2250 |             ZU_Error << "Error loading save: mGamerServer->loadSave failed";
   2251 |             requestExit();
   2252 |         }
   2253 |         else if (!mSimModuleHost.getModule()->loadSave(upPipe))
   2254 |         {
   2255 |             ZU_Error << "Error loading save: simModule->loadSave failed";
   2256 |             ZU_Error << "... This is a known issue with older replays. If we are just viewing a replay, nothing bad will happen.";
   2257 |             ZU_Error << "... If we attempt to resume, the game will not end correctly and surrender will not work.";
   2258 |             /* TODO: prevent resume if the module was could not load from the save.  indicate in the UI that resume will not work with this file. */
   2259 |         }
   2260 | 
   2261 |         if (uncompressed)
   2262 |         {
>  2263 |             ZU_FREE(uncompressed);
   2264 |             uncompressed = nullptr;
   2265 |         }
   2266 | 
   2267 |         return jsonResult;
   2268 |     }
   2269 | 
   2270 |     void createSimFromReplay()
   2271 |     {
   2272 |         mGameServer->createSimFromReplay();
   2273 |     }
   2274 | 
   2275 |     void trimHistoryAndStartSim(float load_time_in_seconds)
   2276 |     {
   2277 |         mGameServer->trimHistoryAndStartSim(load_time_in_seconds);
   2278 |     }
   2279 | 
   2280 |     virtual void update(float dt) override
   2281 |     {
   2282 |         if (mUberProbeRequest.requested)
   2283 |         {
```

### .\server\server_main.cpp:2264
- Signature: L2253:         else if (!mSimModuleHost.getModule()->loadSave(upPipe))
```cpp
   2244 |         {
   2245 |             ZU_Error << "Error loading save: Unknown driver replay version encountered";
   2246 |             requestExit();
   2247 |         }
   2248 |         else if (!mGameServer->loadSave(upPipe, load_time, jsonResult))
   2249 |         {
   2250 |             ZU_Error << "Error loading save: mGamerServer->loadSave failed";
   2251 |             requestExit();
   2252 |         }
   2253 |         else if (!mSimModuleHost.getModule()->loadSave(upPipe))
   2254 |         {
   2255 |             ZU_Error << "Error loading save: simModule->loadSave failed";
   2256 |             ZU_Error << "... This is a known issue with older replays. If we are just viewing a replay, nothing bad will happen.";
   2257 |             ZU_Error << "... If we attempt to resume, the game will not end correctly and surrender will not work.";
   2258 |             /* TODO: prevent resume if the module was could not load from the save.  indicate in the UI that resume will not work with this file. */
   2259 |         }
   2260 | 
   2261 |         if (uncompressed)
   2262 |         {
   2263 |             ZU_FREE(uncompressed);
>  2264 |             uncompressed = nullptr;
   2265 |         }
   2266 | 
   2267 |         return jsonResult;
   2268 |     }
   2269 | 
   2270 |     void createSimFromReplay()
   2271 |     {
   2272 |         mGameServer->createSimFromReplay();
   2273 |     }
   2274 | 
   2275 |     void trimHistoryAndStartSim(float load_time_in_seconds)
   2276 |     {
   2277 |         mGameServer->trimHistoryAndStartSim(load_time_in_seconds);
   2278 |     }
   2279 | 
   2280 |     virtual void update(float dt) override
   2281 |     {
   2282 |         if (mUberProbeRequest.requested)
   2283 |         {
   2284 |             mUberProbeRequest.requested = false;
```

### .\server\server_main.cpp:2410
- Signature: Not found within 120 lines above match
```cpp
   2390 | 
   2391 |     virtual void recvMessage(RefNoCount<GameServer::Connection> connection, std::string const & rawMsg) override
   2392 |     {
   2393 |         ScopedLock lock(mMutex);
   2394 | 
   2395 |         if (mServerModuleHost.getModule())
   2396 |         {
   2397 |             Json parsedMsg;
   2398 |             try
   2399 |             {
   2400 |                 parsedMsg = parseJson(rawMsg);
   2401 |             }
   2402 |             catch (...)
   2403 |             {
   2404 |                 ZU_Error << "Invalid message received from connection " << connection->playerName() << ": " << rawMsg;
   2405 |             }
   2406 |             mServerModuleHost.getModule()->message(connection, parsedMsg);
   2407 |         }
   2408 |     }
   2409 | 
>  2410 |     virtual void recvModFileData(zu::RefNoCount<GameServer::Connection> connection, ModFileDataPackageBundleAuthorized const & bundle_auth) override
   2411 |     {
   2412 |         ScopedLock lock(mMutex);
   2413 | 
   2414 |         std::string check_auth_token = bundle_auth.auth_token;
   2415 | 
   2416 |         if (mGameServer->loadAndMountModFileData(bundle_auth))
   2417 |         {
   2418 |             Json data(Json::makeObject());
   2419 |             data.set("message_type", Json::makeString("mod_data_updated"));
   2420 |             Json payload(Json::makeObject());
   2421 |             payload.set("auth_token", Json::makeString(check_auth_token));
   2422 |             data.set("payload", payload);
   2423 | 
   2424 |             if (mServerModuleHost.getModule())
   2425 |                 mServerModuleHost.getModule()->message(connection, data);
   2426 |         }
   2427 |     }
   2428 | 
   2429 |     virtual void disconnected(RefNoCount<GameServer::Connection> connection) override
   2430 |     {
```

### .\server\server_main.cpp:2414
- Signature: Not found within 120 lines above match
```cpp
   2394 | 
   2395 |         if (mServerModuleHost.getModule())
   2396 |         {
   2397 |             Json parsedMsg;
   2398 |             try
   2399 |             {
   2400 |                 parsedMsg = parseJson(rawMsg);
   2401 |             }
   2402 |             catch (...)
   2403 |             {
   2404 |                 ZU_Error << "Invalid message received from connection " << connection->playerName() << ": " << rawMsg;
   2405 |             }
   2406 |             mServerModuleHost.getModule()->message(connection, parsedMsg);
   2407 |         }
   2408 |     }
   2409 | 
   2410 |     virtual void recvModFileData(zu::RefNoCount<GameServer::Connection> connection, ModFileDataPackageBundleAuthorized const & bundle_auth) override
   2411 |     {
   2412 |         ScopedLock lock(mMutex);
   2413 | 
>  2414 |         std::string check_auth_token = bundle_auth.auth_token;
   2415 | 
   2416 |         if (mGameServer->loadAndMountModFileData(bundle_auth))
   2417 |         {
   2418 |             Json data(Json::makeObject());
   2419 |             data.set("message_type", Json::makeString("mod_data_updated"));
   2420 |             Json payload(Json::makeObject());
   2421 |             payload.set("auth_token", Json::makeString(check_auth_token));
   2422 |             data.set("payload", payload);
   2423 | 
   2424 |             if (mServerModuleHost.getModule())
   2425 |                 mServerModuleHost.getModule()->message(connection, data);
   2426 |         }
   2427 |     }
   2428 | 
   2429 |     virtual void disconnected(RefNoCount<GameServer::Connection> connection) override
   2430 |     {
   2431 |         ScopedLock lock(mMutex);
   2432 | 
   2433 |         if (mServerModuleHost.getModule())
   2434 |             mServerModuleHost.getModule()->disconnect(connection);
```

### .\server\server_main.cpp:2416
- Signature: Not found within 120 lines above match
```cpp
   2396 |         {
   2397 |             Json parsedMsg;
   2398 |             try
   2399 |             {
   2400 |                 parsedMsg = parseJson(rawMsg);
   2401 |             }
   2402 |             catch (...)
   2403 |             {
   2404 |                 ZU_Error << "Invalid message received from connection " << connection->playerName() << ": " << rawMsg;
   2405 |             }
   2406 |             mServerModuleHost.getModule()->message(connection, parsedMsg);
   2407 |         }
   2408 |     }
   2409 | 
   2410 |     virtual void recvModFileData(zu::RefNoCount<GameServer::Connection> connection, ModFileDataPackageBundleAuthorized const & bundle_auth) override
   2411 |     {
   2412 |         ScopedLock lock(mMutex);
   2413 | 
   2414 |         std::string check_auth_token = bundle_auth.auth_token;
   2415 | 
>  2416 |         if (mGameServer->loadAndMountModFileData(bundle_auth))
   2417 |         {
   2418 |             Json data(Json::makeObject());
   2419 |             data.set("message_type", Json::makeString("mod_data_updated"));
   2420 |             Json payload(Json::makeObject());
   2421 |             payload.set("auth_token", Json::makeString(check_auth_token));
   2422 |             data.set("payload", payload);
   2423 | 
   2424 |             if (mServerModuleHost.getModule())
   2425 |                 mServerModuleHost.getModule()->message(connection, data);
   2426 |         }
   2427 |     }
   2428 | 
   2429 |     virtual void disconnected(RefNoCount<GameServer::Connection> connection) override
   2430 |     {
   2431 |         ScopedLock lock(mMutex);
   2432 | 
   2433 |         if (mServerModuleHost.getModule())
   2434 |             mServerModuleHost.getModule()->disconnect(connection);
   2435 |     }
   2436 | 
```

## Summary
- Terms searched: 15
- Total snippets captured: 227
