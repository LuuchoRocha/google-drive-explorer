import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Utils from './utils';

const Folder = props => {
  const date = new Date(props.data.modifiedTime);
  return (
    <TouchableOpacity style={styles.container} onPress={() => { props.onPress(props.data.id)}}>
      <View style={styles.flexContainer}>
        <View style={styles.flex}>
          <Icon size={24} color="#777" name="folder" style={styles.icon} />
          <Text style={styles.name}>{props.data.name}</Text>
        </View>
        <View style={styles.dateWrapper}>
          <Text style={styles.date}>{props.data.elements.length} { props.data.elements.length == 1 ? 'element' : 'elements' }</Text>
          <Text style={styles.date}>{date.toLocaleDateString()} {date.toLocaleTimeString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
  },
  flexContainer: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
  },
  container: {
    width: Dimensions.get("window").width - 16,
    height: 48,
    margin: 8,
    marginBottom: 0,
    borderRadius: 4,
    borderWidth: 0.25,
    borderColor: 'rgba(0, 0, 0, 0.25)',
  },
  name: {},
  date: { 
    fontStyle: "italic",
    color: '#777', 
    paddingHorizontal: 8,
    fontSize: 12,
  },
  icon: {
    paddingHorizontal: 8,
  },
  dateWrapper: {
    alignItems: 'flex-end'
  },
})

export default Folder;
