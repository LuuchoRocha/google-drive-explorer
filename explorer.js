import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, FlatList, RefreshControl, PermissionsAndroid, Platform, Alert, Text, Animated } from 'react-native';
import Folder from './folder';
import File from './file';
import * as API from './api';
import RNFetchBlob from 'rn-fetch-blob'

const dimensions = Dimensions.get('window');

const GoogleDriveExplorer = props => {
  const [state, _setState] = useState({
    loading: true,
    error: false,
    folderID: props.url.split('/').pop(),
    parents: [],
    files: [],
    accessToken: null,
  });

  const [value] = useState(new Animated.Value(0));

  const setState = newState => {
    _setState({
      ...state,
      ...newState,
    });
  };

  const goToParent = () => {
    if (parentPresent()) {
      setState({ loading: true, folderID: state.parents.pop() })
    }
  };

  const parentPresent = () => {
    return state.parents.length > 0;
  };

  props.reference(() => {
    return { goToParent, parentPresent };
  });

  const renderFolder = folder => {
    return (
      <Folder data={folder} onPress={changeFolder} />
    );
  };

  const changeFolder = (id) => {
    state.parents.push(state.folderID);
    setState({ loading: true, folderID: id })
  }

  const renderFile = file => {
    return (
      <File data={file} onPress={() => askDownload(file)} />
    );
  };

  const renderItem = object => {
    if (object.item.mimeType === API.folderMimeType) {
      return renderFolder(object.item);
    } else {
      return renderFile(object.item);
    }
  };

  const fetchData = () => {
    setState({ loading: true });
    const options = {
      headers: new Headers({
        'Authorization': 'Bearer ' + state.accessToken
      })
    };
    fetch(API.urls.folderInfo(state.folderID), options).then((folderResponse) => {
      if (folderResponse.ok) {
        folderResponse.json().then((folder) => {
          fetch(API.urls.folderFiles(state.folderID), options).then((filesResponse) => {
            if (filesResponse.ok) {
              filesResponse.json().then((filesJson) => {
                let folders = [];
                let files = [];
                filesJson.files.forEach(element => {
                  if (element.mimeType === API.folderMimeType) {
                    folders.push(element);
                  } else {
                    files.push(element);
                  }
                });
                folders = folders.sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0));
                files = files.sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0));
                setState({ files: folders.concat(files), loading: false });
              });
            }
          });
        });
      } else {
        setState({ loading: false, error: true });
      }
    });
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        return PermissionsAndroid.RESULTS.GRANTED === await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        ]);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const download = async (file) => {
    await requestStoragePermission();
    const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`
    const destination = RNFetchBlob.fs.dirs.DownloadDir + '/' + file.name;
    RNFetchBlob.config({ path: destination, addAndroidDownloads: { useDownloadManager: true, notification: true, title: file.name, mime: file.mimeType, path: destination } })
      .fetch('GET', url, { Authorization: 'Bearer ' + state.accessToken })
      .progress((received, total) => {
        setState({ downloadProgress: received / total * 100 });
      }).then((resp) => {
        Alert.alert(
          'Download complete',
          'Your file has been saved as "' + file.name + '" in your downloads folder',
          [
            {
              text: 'Open file', onPress: () => {
                if (Platform.OS === 'android') {
                  RNFetchBlob.android.actionViewIntent(destination, file.mimeType);
                } else if (Platform.OS === 'ios') {
                  RNFetchBlob.ios.previewDocument(destination);
                } else {
                  console.warn('Unsupported platform');
                }
              }
            },
            { text: 'OK' }
          ]
        );
      }).catch((error) => {
        console.log(error);
      })
  };

  const askDownload = (file) => {
    Alert.alert(file.name,
      'Do you want to download this file?',
      [
        { text: 'Cancel' },
        { text: 'OK', onPress: () => download(file) },
      ]
    );
  };

  useEffect(() => {
    API.getAccessToken().then((token) => {
      setState({ accessToken: token });
    })
  }, []);

  useEffect(() => {
    if (state.accessToken != null) fetchData();
  }, [state.accessToken, state.folderID]);


  return (
    <View style={styles.container}>
      <FlatList
        style={styles.flatList}
        data={state.files}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            onRefresh={fetchData}
            refreshing={state.loading}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    height: dimensions.height,
    width: dimensions.width,
  },
  row: {
    flex: 1,
    justifyContent: "space-around",
  }
});

export default GoogleDriveExplorer;
