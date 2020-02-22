import React from "react";
import { PermissionsAndroid, Platform, Dimensions, StyleSheet } from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialCommunityIcons";

const sortByName = array => {
  return array.sort((a, b) => {
    if (a.name < b.name) return -1;
    else if (a.name > b.name) return 1;
    else return 0;
  });
};

const requestStoragePermission = async () => {
  if (Platform.OS === "android") {
    try {
      return PermissionsAndroid.RESULTS.GRANTED === await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);
    } catch (error) {
      console.warn(error)
    }
  };
};

const dimensions = Dimensions.get("window");

const units = ['KB','MB','GB','TB','PB','EB','ZB','YB'];

const formatSize = size => {
  if(Math.abs(size) < 1024) {
    return size + ' B';
  } else {
    let unit = -1;
    while (1024 < Math.abs(size) && unit < units.length - 1) {
      size /= 1024;
      unit++;
    }
    return Math.round(size) + ' ' + units[unit];
  }
}

const Icon = (props) => {
  if (props.mimeType.match('image/')) {
    return(
      <MaterialIcon size={24} color="#f55" name="file-image" style={styles.icon} />
    );
  }
  if (props.mimeType.match('video/')) {
    return(
      <MaterialIcon size={24} color="#f55" name="file-video" style={styles.icon} />
    );
  }
  if (props.mimeType.match('text/')) {
    return(
      <MaterialIcon size={24} color="#49f" name="file-document" style={styles.icon} />
    );
  }
  if (props.mimeType.match('audio/')) {
    return(
      <MaterialIcon size={24} color="#f55" name="file-music" style={styles.icon} />
    );
  }
  if (props.mimeType.match('application/pdf')) {
    return(
      <MaterialIcon size={24} color="#f55" name="file-pdf" style={styles.icon} />
    );
  }
  if (props.mimeType.match('application/pdf')) {
    return(
      <MaterialIcon size={24} color="#f55" name="file-pdf" style={styles.icon} />
    );
  }
  if (props.mimeType.match(/application\/zip|gzip|x-7z-compressed|x-bzip|x-bzip2|x-rar-compressed|x-tar/)) {
    return(
      <MaterialIcon size={24} color="#B84" name="zip-box" style={styles.icon} />
    );
  }
  return(
    <MaterialIcon size={24} color="#49f" name="file" style={styles.icon} />
  );
}

export { sortByName, requestStoragePermission, dimensions, formatSize, Icon };

const styles = StyleSheet.create({
  icon: {
    paddingHorizontal: 8
  }
});