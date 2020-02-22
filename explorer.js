import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Platform, Alert } from "react-native";
import RNFetchBlob from "rn-fetch-blob";
import * as API from "./api";
import * as Utils from './utils'
import Folder from "./folder";
import File from "./file";

const GoogleDriveExplorer = props => {
  const [state, _setState] = useState({
    loading: true,
    error: false,
    folderID: props.url.split("/").pop(),
    parents: [],
    files: [],
    accessToken: null
  });

  const isFirstRun = useRef(true);

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
      setState({ loading: true, folderID: state.parents.pop() });
    }
  };

  const changeFolder = id => {
    state.parents.push(state.folderID);
    setState({ loading: true, folderID: id });
  };

  const renderFolder = folder => {
    return <Folder data={folder} onPress={changeFolder} />;
  };

  const renderFile = file => {
    return <File data={file} onPress={() => askDownload(file)} />;
  };

  const renderItem = object => {
    if (object.item.mimeType === API.folderMimeType) {
      return renderFolder(object.item);
    } else {
      return renderFile(object.item);
    }
  };

  const fetchData = async (accessToken) => {
    setState({ loading: true });

    const token = accessToken != null ? accessToken : state.accessToken;
    const options = API.buildFetchOptions(token);
    const filesResponse = await fetch(API.urls.folderFiles(state.folderID), options);

    if (filesResponse.ok) {
      const json = await filesResponse.json();
      let folders = [];
      let files = [];
      let folderResponse, folderJsonResponse;

      for (const element of json.files) {
        if (element.mimeType === API.folderMimeType) {
          folderResponse = await fetch(API.urls.folderFilesCount(element.id), options);
          folderJsonResponse = await folderResponse.json();
          element.files = folderJsonResponse.files;
          folders.push(element);
        } else {
          files.push(element);
        }
      }

      folders = Utils.sortByName(folders);
      files = Utils.sortByName(files);

      console.log(files);
      
      if (accessToken != null ) {
        setState({ files: folders.concat(files), loading: false, accessToken: token });
      } else {
        setState({ files: folders.concat(files), loading: false });
      }
    }
    else {
      setState({ loading: false, error: true });
    }
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

  useEffect(() => {
    API.getAccessToken().then(token => {
      console.log("Fetching after get token")
      fetchData(token);
    });
  }, []);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    fetchData();
  }, [state.folderID]);

  props.reference(() => {
    return { goToParent: goToParent.bind(this), parentPresent: parentPresent.bind(this) };
  });

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.flatList}
        data={state.files}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl onRefresh={fetchData} refreshing={state.loading} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  flatList: {
    height: Utils.dimensions.height,
    width: Utils.dimensions.width
  }
});

export default GoogleDriveExplorer;
