import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Utils from './utils';

const Folder = props => {
  const date = new Date(props.data.modifiedTime);
  return (
    <TouchableOpacity style={styles.container} onPress={() => { props.onPress(props.data.id)}} onLongPress={props.onPressMenu}>
      <View style={styles.flexContainer}>
        <Utils.Icon mimeType={props.data.mimeType} size={32} />
        <View style={styles.flex}>
          <Text>{props.data.name}</Text>
          <Text style={styles.info}>{props.data.elements.length} { props.data.elements.length == 1 ? 'element' : 'elements' }</Text>
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

export default Folder;
