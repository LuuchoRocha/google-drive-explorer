import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
  Alert,
  ActivityIndicator,
  Text,
  BackHandler,
  Animated,
  TouchableOpacity,
  Easing,
} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import Folder from './folder';
import File from './file';
import * as API from './api';
import * as Utils from './utils';

const dimensions = Utils.dimensions;

const GoogleDriveExplorer = props => {
  const [state, _setState] = useState({
    loading: true,
    error: false,
    rootId: props.url.split('/').pop(),
    folderID: props.url.split('/').pop(),
    parents: [],
    data: {},
    current: null,
    accessToken: null,
    firstLoad: true,
    menuVisible: false,
    menuStyle: {
      top: 0,
      left: 0,
    },
  });

  const [menuOpacity] = useState(new Animated.Value(0));

  const setState = newState => {
    _setState({
      ...state,
      ...newState,
    });
  };

  const parentPresent = () => {
    return state.parents.length > 0;
  };

  const goToParent = () => {
    if (parentPresent()) {
      setState({folderID: state.parents.pop()});
    }
  };

  const changeFolder = id => {
    state.parents.push(state.folderID);
    setState({folderID: id});
  };

  const renderFolder = folder => {
    return (
      <Folder
        data={folder}
        onPress={changeFolder}
        key={folder.id}
        onPressMenu={() => {
          openMenu(folder);
        }}
      />
    );
  };

  const renderFile = file => {
    return (
      <File
        data={file}
        onPress={() => askDownload(file)}
        key={file.id}
        onPressMenu={() => { openMenu(file) }}
      />
    );
  };

  const renderItem = object => {
    if (object.item.mimeType === API.folderMimeType) {
      object.item.elements = state.data[object.item.id].elements;
      return renderFolder(object.item);
    } else {
      return renderFile(object.item);
    }
  };

  const fetchData = useCallback(async (accessToken, folderId) => {
      setState({loading: true});

      const options = API.buildFetchOptions(accessToken);
      let pending = [folderId || state.folderID];
      let data = {};
      let files,
        folders,
        folderResponse,
        filesResponse,
        folderJson,
        filesJson,
        id;

      do {
        id = pending.pop();
        folderResponse = await fetch(API.urls.folderInfo(id), options);
        filesResponse = await fetch(API.urls.folderFiles(id), options);
        if (folderResponse.ok && filesResponse.ok) {
          folderJson = await folderResponse.json();
          filesJson = await filesResponse.json();
          folders = [];
          files = [];

          setState({current: folderJson});

          for (const element of filesJson.files) {
            if (element.mimeType === API.folderMimeType) {
              pending.push(element.id);
              folders.push(element);
            } else {
              files.push(element);
            }
          }

          folders = Utils.sortByName(folders);
          files = Utils.sortByName(files);

          data[id] = {
            id: folderJson.id,
            name: folderJson.name,
            elements: folders.concat(files),
          };
        } else {
          console.warn("Can't load files");
        }
      } while (pending.length > 0);

      setState({
        data: data,
        loading: false,
        accessToken: accessToken,
        firstLoad: false,
      });
    }, 
    [state.rootId]
  );

  const download = file => {
    Utils.requestStoragePermission().then(() => {
      const destination = RNFetchBlob.fs.dirs.DownloadDir + '/' + file.name;
      RNFetchBlob.config({
        path: destination,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: file.name,
          mime: file.mimeType,
          path: destination,
        },
      })
        .fetch(
          'GET',
          API.urls.downloadFile(file.id),
          API.buildAuthorizationHeader(state.accessToken),
        )
        .progress((received, total) => {
          setState({downloadProgress: (received / total) * 100});
        })
        .then(() => {
          Alert.alert(
            'Download complete',
            `Your file has been saved as "${file.name}" in your downloads folder`,
            [
              {
                text: 'Open file',
                onPress: () => {
                  if (Platform.OS === 'android') {
                    RNFetchBlob.android.actionViewIntent(
                      destination,
                      file.mimeType,
                    );
                  } else if (Platform.OS === 'ios') {
                    RNFetchBlob.ios.previewDocument(destination);
                  } else {
                    console.warn('Unsupported platform');
                  }
                },
              },
              {text: 'OK'},
            ],
          );
        })
        .catch(error => {
          console.warn(error);
        });
    });
  };

  const askDownload = file => {
    Alert.alert(file.name, 'Do you want to download this file?', [
      {text: 'Cancel'},
      {text: 'OK', onPress: () => download(file)},
    ]);
  };

  const backButtonHandler = () => {
    if (state.menuVisible) {
      closeMenu();
      return true;
    } else if (parentPresent()) {
      goToParent();
      return true;
    } else {
      return false;
    }
  };

  const refresh = () => {
    fetchData(state.accessToken, state.rootId);
  };

  useEffect(() => {
    API.getAccessToken().then(token => {
      fetchData(token);
    });
  }, [fetchData]);

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', backButtonHandler);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', backButtonHandler);
  }, [backButtonHandler]);

  props.reference(() => {
    return {
      goToParent: goToParent.bind(this),
      parentPresent: parentPresent.bind(this),
      refresh: refresh.bind(this),
    };
  });

  const getData = () => {
    if (state.data[state.folderID]) return state.data[state.folderID].elements;
    else return [];
  };

  const renderFolderMenu = () => {
    return (
      <View style={styles.menuBox}>
        <View style={{ flex: 1, backgroundColor: "yellow", justifyContent: "center" }}>
          <Folder
            data={state.current}
            key={state.current.id + '-menu'}
          />
        </View>
      </View>
    );
  }

  const renderFileMenu = () => {
    return (
      <View style={styles.menuBox}>
        <View style={{ flex: 0, flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.25, borderColor: "#777" }}>
          <Utils.Icon mimeType={state.current.mimeType} size={24} />
          <Text>{state.current.name}</Text>
        </View>
      </View>
    );
  }

  const renderMenu = () => {
    if (state.menuVisible && state.current) {
      return (
        <TouchableOpacity style={styles.menuBox} activeOpacity={1}>
          <View style={{ flex: 0, flexDirection: "row", alignItems: "center", paddingVertical: 8, marginBottom: 8, borderBottomWidth: 0.25, borderColor: "#777" }}>
            <Utils.Icon mimeType={state.current.mimeType} size={24} />
            <Text>{state.current.name}</Text>
          </View>
          <Text style={{ padding: 8, paddingTop: 0 }} onPress={() => askDownload(state.current)}>Download</Text>
          <Text style={{ padding: 8, paddingTop: 0 }}>Share</Text>
          <Text style={{ padding: 8, paddingTop: 0 }}>Copy link</Text>
        </TouchableOpacity>
      );
    }
  };

  const closeMenu = useCallback(() => {
    Animated.timing(menuOpacity, { toValue: 0, duration: 300 }).start(() => setState({ menuVisible: false }));
  });

  const openMenu = useCallback(element => {
    setState({current: element, menuVisible: true});
    Animated.timing(menuOpacity, { toValue: 1, duration: 300 }).start();
  });

  if (state.firstLoad) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText(props.color)}>
          Loading {state.current != null ? state.current.name : 'files'}...
        </Text>
        <ActivityIndicator color={props.color} size={64} />
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <FlatList
          style={styles.flatList}
          data={getData()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl onRefresh={refresh} refreshing={state.loading} />
          }
        />
        { state.menuVisible && <Animated.View style={styles.menuBackground(menuOpacity)}></Animated.View> } 
        { state.menuVisible &&
          <Animated.View style={styles.menuWrapper(menuOpacity)}>
            <TouchableOpacity activeOpacity={1} style={styles.menu} onPress={closeMenu}>
              { renderMenu() }
            </TouchableOpacity>
          </Animated.View>
        }
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatList: {
    height: dimensions.height,
    width: dimensions.width,
  },
  loadingText: color => ({
    color: color,
    fontSize: 16,
    fontWeight: 'bold',
  }),
  menuWrapper: (opacity) => ({
    position: 'absolute',
    top: opacity.interpolate({ inputRange: [0, 1], outputRange: [500, 0]}),
    right: 0,
    bottom: 0,
    left: 0,
    height: '100%',
    width: '100%',
  }),
  menu: {
    flex: 1,
    justifyContent: "flex-end",
  },
  menuBox: {
    backgroundColor: "#FFF",
    paddingBottom: 8,
    marginBottom: -8,
    borderRadius: 8,
    elevation: 4
  },
  menuBackground: (opacity) => ({
    opacity: opacity,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    height: dimensions.height,
    width: dimensions.width,
  })
});

export default GoogleDriveExplorer;
