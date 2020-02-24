import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import * as Utils from './utils';

const File = props => {
  const date = new Date(props.data.modifiedTime);
  return (
    <TouchableOpacity style={styles.container} onPress={props.onPress} onLongPress={props.onPressMenu}>
      <View style={styles.flexContainer}>
        <Utils.Icon mimeType={props.data.mimeType} size={32} />
        <View style={styles.flex}>
          <Text>{props.data.name}</Text>
          <Text style={styles.info}>{Utils.formatSize(props.data.size)}</Text>
          <Text style={styles.info}>{date.toLocaleDateString()} {date.toLocaleTimeString()}</Text>
        </View>
        <View style={styles.menuButton}>
          <TouchableOpacity onPress={props.onPressMenu}>
            <Utils.MenuIcon />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
  },
  container: {
    width: Dimensions.get("window").width - 16,
    height: 64,
    margin: 8,
    marginBottom: 0,
  },
  info: { 
    fontStyle: "italic",
    color: '#777', 
    fontSize: 12,
  },
  icon: {
    paddingHorizontal: 8,
  },
  menuButton: {
    flex: 1,
    alignItems: "flex-end"
  }
})

export default File;
