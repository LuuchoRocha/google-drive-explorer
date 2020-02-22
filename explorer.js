import React, { useEffect, useState } from "react";
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
    console.log('render folder: ', folder.name);
    fetch(API.urls.folderFilesCount(folder.id), API.buildFetchOptions(state.accessToken)).then((resp) => {
      if (resp.ok) {
        resp.json().then((jsonResponse) => {
          //console.log(jsonResponse);
        })
      } else {
        throw 'Error loading folder files';
      }
    }).catch((error) => {
      console.warn(error);
    });
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

  const fetchData = () => {
    if (!state.loading) {
      setState({ loading: true });
    }

    const options = API.buildFetchOptions(state.accessToken);
    fetch(API.urls.folderInfo(state.folderID), options).then(folderResponse => {
      if (folderResponse.ok) {
        folderResponse.json().then(folder => {
          fetch(API.urls.folderFiles(state.folderID), options).then(
            filesResponse => {
              if (filesResponse.ok) {
                filesResponse.json().then(filesJson => {
                  let folders = [];
                  let files = [];
                  filesJson.files.forEach(element => {
                    if (element.mimeType === API.folderMimeType) {
                      folders.push(element);
                    } else {
                      files.push(element);
                    }
                  });
                  folders = Utils.sortByName(folders);
                  files = Utils.sortByName(files);
                  setState({ files: folders.concat(files), loading: false });
                });
              }
            }
          );
        });
      } else {
        setState({ loading: false, error: true });
      }
    });
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
      setState({ accessToken: token });
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [state.folderID]);

  useEffect(() => {
    fetchData();
  }, [state.accessToken]);

  props.reference(() => {
    return { goToParent: goToParent.bind(this), parentPresent: parentPresent.bind(this) };
  });
  
  console.log("PASO!");

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
