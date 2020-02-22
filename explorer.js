import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Platform, Alert, ActivityIndicator, Text } from "react-native";
import RNFetchBlob from "rn-fetch-blob";
import * as API from "./api";
import * as Utils from './utils'
import Folder from "./folder";
import File from "./file";

const GoogleDriveExplorer = props => {
  const [state, _setState] = useState({
    loading: true,
    error: false,
    rootId: props.url.split("/").pop(),
    folderID: props.url.split("/").pop(),
    parents: [],
    data: {},
    accessToken: null,
    firstLoad: true,
  });

  const setState = newState => {
    _setState({
      ...state,
      ...newState
    });
  };

  const parentPresent = () => {
    return state.parents.length > 0;
  };

  const goToParent = () => {
    if (parentPresent()) {
      setState({ folderID: state.parents.pop() });
    }
  };

  const changeFolder = id => {
    state.parents.push(state.folderID);
    setState({ folderID: id });
  };

  const renderFolder = folder => {
    return <Folder data={folder} onPress={changeFolder} key={folder.id} />;
  };

  const renderFile = file => {
    return <File data={file} onPress={() => askDownload(file)} key={file.id} />;
  };

  const renderItem = object => {
    if (object.item.mimeType === API.folderMimeType) {
      object.item.elements = state.data[object.item.id].elements;
      return renderFolder(object.item);
    } else {
      return renderFile(object.item);
    }
  };

  const fetchData = async (accessToken, folderId) => {
    setState({ loading: true });

    const options = API.buildFetchOptions(accessToken);
    let pending = [folderId || state.folderID];
    let data = {};
    let files, folders, folderResponse, filesResponse, folderJson, filesJson, id;

    do {
      id = pending.pop();
      folderResponse = await fetch(API.urls.folderInfo(id), options);
      filesResponse = await fetch(API.urls.folderFiles(id), options);
      if (folderResponse.ok && filesResponse.ok) {
        folderJson = await folderResponse.json();
        filesJson = await filesResponse.json();
        folders = [];
        files = [];

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

        data[id] = { id: folderJson.id, name: folderJson.name, elements: folders.concat(files) };
      } else {
        console.warn('Can\'t load files');
      }
    } while (pending.length > 0);

    setState({ data: data, loading: false, accessToken: accessToken, firstLoad: false });
  };

  const download = file => {
    Utils.requestStoragePermission().then(() => {
      const destination = RNFetchBlob.fs.dirs.DownloadDir + "/" + file.name;
      RNFetchBlob.config({
        path: destination,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: file.name,
          mime: file.mimeType,
          path: destination
        }
      })
        .fetch("GET", API.urls.downloadFile(file.id), API.buildAuthorizationHeader(state.accessToken))
        .progress((received, total) => {
          setState({ downloadProgress: (received / total) * 100 });
        })
        .then(() => {
          Alert.alert(
            "Download complete",
            `Your file has been saved as "${file.name}" in your downloads folder`,
            [
              {
                text: "Open file",
                onPress: () => {
                  if (Platform.OS === "android") {
                    RNFetchBlob.android.actionViewIntent(
                      destination,
                      file.mimeType
                    );
                  } else if (Platform.OS === "ios") {
                    RNFetchBlob.ios.previewDocument(destination);
                  } else {
                    console.warn("Unsupported platform");
                  }
                }
              },
              { text: "OK" }
            ]
          );
        })
        .catch(error => {
          console.warn(error);
        });
    })
  };

  const askDownload = file => {
    Alert.alert(file.name, "Do you want to download this file?", [
      { text: "Cancel" },
      { text: "OK", onPress: () => download(file) }
    ]);
  };

  const refresh = () => {
    fetchData(state.accessToken, state.rootId);
  }

  useEffect(() => {
    API.getAccessToken().then(token => {
      fetchData(token);
    });
  }, []);

  props.reference(() => {
    return { goToParent: goToParent.bind(this), parentPresent: parentPresent.bind(this), refresh: refresh.bind(this) };
  });

  const getData = () => {
    console.log('getData', state);
    if (state.data[state.folderID]) return state.data[state.folderID].elements;
    else return [];
  }

  if (state.firstLoad) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: props.color, fontSize: 16, fontWeight: "bold" }}>Loading files...</Text>
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
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  flatList: {
    height: Utils.dimensions.height,
    width: Utils.dimensions.width
  }
});

export default GoogleDriveExplorer;
