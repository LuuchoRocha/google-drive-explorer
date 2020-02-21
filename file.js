import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const File = props => {
  const date = new Date(props.data.modifiedTime);
  return (
    <TouchableOpacity style={styles.container} onPress={props.onPress}>
      <View style={styles.flexContainer}>
        <View style={styles.flex}>
          <Icon size={24} color="#49f" name="insert-drive-file" style={styles.icon} />
          <Text style={styles.name}>{props.data.name}</Text>
        </View>
        <View style={styles.dateWrapper}>
          <Text style={styles.date}>{date.toLocaleDateString()}</Text>
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
    justifyContent: "space-between",
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

export default File;
