import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAtom } from "jotai";
import { polarisUsersAtom } from "@/src/hooks/atoms";
import PolarisServer from "@/src/services/polaris/PolarisServer";
import { Ionicons } from "@expo/vector-icons";
import { toastService } from "@/src/services/toastService";
import { User, CreateUserDto, UpdateUserDto } from "@/src/types/user";
import { Modal } from "@/src/components/ui/Modal";

export default function Users() {
  const [users, setUsers] = useAtom(polarisUsersAtom);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [formData, setFormData] = useState<CreateUserDto>({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    isAdmin: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const fetchedUsers = await PolarisServer.getUsers();
    setUsers(fetchedUsers);
    setIsLoading(false);
  };

  const handleAddUser = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.password) {
      toastService.warning({ title: "Please fill all required fields" });
      return;
    }

    setIsLoading(true);
    const newUser = await PolarisServer.createUser(formData);
    if (newUser) {
      await loadUsers();
      setShowAddModal(false);
      resetForm();
      toastService.success({ title: "User created successfully" });
    }
    setIsLoading(false);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    const updateData: UpdateUserDto = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
    };

    if (formData.password) {
      updateData.password = formData.password;
    }

    updateData.isAdmin = formData.isAdmin;

    setIsLoading(true);
    const success = await PolarisServer.updateUser(selectedUser.id, updateData);
    if (success) {
      await loadUsers();
      setShowEditModal(false);
      resetForm();
      toastService.success({ title: "User updated successfully" });
    }
    setIsLoading(false);
  };

  const handleDeleteUser = async (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      setIsLoading(true);
      const success = await PolarisServer.deleteUser(user.id);
      if (success) {
        await loadUsers();
        toastService.success({ title: "User deleted successfully" });
      }
      setIsLoading(false);
    }
  };

  const handleActivateUser = async (user: User) => {
    setIsLoading(true);
    const success = await PolarisServer.activateUser(user.id);
    if (success) {
      await loadUsers();
      toastService.success({ title: "User activated successfully" });
    }
    setIsLoading(false);
  };

  const handleDeactivateUser = async (user: User) => {
    setIsLoading(true);
    const success = await PolarisServer.deactivateUser(user.id);
    if (success) {
      await loadUsers();
      toastService.success({ title: "User deactivated successfully" });
    }
    setIsLoading(false);
  };

  const handlePromoteUser = async (user: User) => {
    setIsLoading(true);
    const success = await PolarisServer.promoteToAdmin(user.id);
    if (success) {
      await loadUsers();
      toastService.success({ title: "User promoted to admin successfully" });
    }
    setIsLoading(false);
  };

  const handleDemoteUser = async (user: User) => {
    setIsLoading(true);
    const success = await PolarisServer.demoteFromAdmin(user.id);
    if (success) {
      await loadUsers();
      toastService.success({ title: "User demoted from admin successfully" });
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      isAdmin: false,
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: "",
      isAdmin: user.isAdmin,
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Ionicons
              name="people"
              size={32}
              className="!text-primary mr-2"
            />
            <Text className="text-2xl font-bold text-primary">Users</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-primary px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white ml-2 font-medium">Add User</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row mb-4">
          <View className="flex-1 bg-surface rounded-lg flex-row items-center px-3 py-2">
            <Ionicons name="search" size={20} className="!text-secondary mr-2" />
            <TextInput
              className="flex-1 text-text outline-none"
              placeholder="Search users..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} className="!text-secondary" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={loadUsers}
            className="ml-2 bg-surface p-2 rounded-lg"
          >
            <Ionicons name="refresh" size={24} className="!text-primary" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-secondary">Loading users...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1">
            <View className="bg-surface rounded-lg overflow-hidden">
              <View className="flex-row bg-primary/10 p-3">
                <Text className="font-medium text-primary w-10"></Text>
                <Text className="font-medium text-primary flex-1">Name</Text>
                <Text className="font-medium text-primary flex-1">Email</Text>
                <Text className="font-medium text-primary w-20 text-center">Status</Text>
                <Text className="font-medium text-primary w-20 text-center">Role</Text>
                <Text className="font-medium text-primary w-24 text-center">Actions</Text>
              </View>
              
              {filteredUsers.length === 0 ? (
                <View className="p-4 items-center">
                  <Text className="text-secondary">No users found</Text>
                </View>
              ) : (
                filteredUsers.map((user, index) => (
                  <View 
                    key={user.id} 
                    className={`flex-row items-center p-3 border-b border-border ${index % 2 === 1 ? 'bg-surface/50' : ''}`}
                  >
                    <View className="w-10 items-center justify-center">
                      {user.avatarUrl ? (
                        <Image 
                          source={{ uri: user.avatarUrl }} 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                          <Text className="text-primary font-bold">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="flex-1 text-text">{user.firstName} {user.lastName}</Text>
                    <Text className="flex-1 text-text">{user.email}</Text>
                    <View className="w-20 items-center">
                      <View className={`px-2 py-1 rounded-full ${user.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Text className={`text-xs ${user.isActive ? 'text-green-800' : 'text-red-800'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    <View className="w-20 items-center">
                      <View className={`px-2 py-1 rounded-full ${user.isAdmin ? 'bg-purple-100' : 'bg-blue-100'}`}>
                        <Text className={`text-xs ${user.isAdmin ? 'text-purple-800' : 'text-blue-800'}`}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </Text>
                      </View>
                    </View>
                    <View className="w-24 flex-row justify-center space-x-1">
                      <TouchableOpacity 
                        onPress={() => openEditModal(user)}
                        className="p-2 bg-primary/10 rounded-lg"
                      >
                        <Ionicons name="pencil" size={16} className="!text-primary" />
                      </TouchableOpacity>
                      
                      {user.isActive ? (
                        <TouchableOpacity 
                          onPress={() => handleDeactivateUser(user)}
                          className="p-2 bg-orange-100 rounded-lg"
                        >
                          <Ionicons name="pause" size={16} className="text-orange-800!" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity 
                          onPress={() => handleActivateUser(user)}
                          className="p-2 bg-green-100 rounded-lg"
                        >
                          <Ionicons name="play" size={16} className="text-green-800!" />
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity 
                        onPress={() => handleDeleteUser(user)}
                        className="p-2 bg-red-100 rounded-lg"
                      >
                        <Ionicons name="trash" size={16} className="text-red-800!" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Add User Modal */}
      <Modal
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
      >
        <View className="space-y-4">
            <Text className="text-secondary mb-1">Add New User</Text>
          <View>
            <Text className="text-secondary mb-1">Email *</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text"
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View>
            <Text className="text-secondary mb-1">First Name *</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text"
              placeholder="First Name"
              value={formData.firstName}
              onChangeText={(text) => setFormData({...formData, firstName: text})}
            />
          </View>
          
          <View>
            <Text className="text-secondary mb-1">Last Name *</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text"
              placeholder="Last Name"
              value={formData.lastName}
              onChangeText={(text) => setFormData({...formData, lastName: text})}
            />
          </View>
          
          <View>
            <Text className="text-secondary mb-1">Password *</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text"
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry
            />
          </View>
          
          <View className="flex-row items-center justify-between">
            <Text className="text-secondary">Admin User</Text>
            <Switch
              value={formData.isAdmin}
              onValueChange={(value) => setFormData({...formData, isAdmin: value})}
            />
          </View>
          
          <View className="flex-row justify-end space-x-2 mt-4">
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              className="bg-surface border border-border px-4 py-2 rounded-lg"
            >
              <Text className="text-text">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleAddUser}
              className="bg-primary px-4 py-2 rounded-lg"
              disabled={isLoading}
            >
              <Text className="text-white">Add User</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isVisible={showEditModal}
        onClose={() => setShowEditModal(false)}
      >
        <View className="space-y-4">
            <Text className="text-secondary mb-1">Edit User</Text>
          <View>
            <Text className="text-secondary mb-1">Email</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text"
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View>
            <Text className="text-secondary mb-1">First Name</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text"
              placeholder="First Name"
              value={formData.firstName}
              onChangeText={(text) => setFormData({...formData, firstName: text})}
            />
          </View>
          
          <View>
            <Text className="text-secondary mb-1">Last Name</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text"
              placeholder="Last Name"
              value={formData.lastName}
              onChangeText={(text) => setFormData({...formData, lastName: text})}
            />
          </View>
          
          <View>
            <Text className="text-secondary mb-1">Password (leave blank to keep current)</Text>
            <TextInput
              className="border border-border rounded-lg p-2 bg-surface text-text"
              placeholder="New Password"
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry
            />
          </View>
          
          <View className="flex-row items-center justify-between">
            <Text className="text-secondary">Admin User</Text>
            <Switch
              value={formData.isAdmin}
              onValueChange={(value) => setFormData({...formData, isAdmin: value})}
            />
          </View>
          
          {selectedUser && (
            <View className="space-y-2 pt-2 border-t border-border">
              <Text className="text-secondary font-medium">Quick Actions</Text>
              <View className="flex-row space-x-2">
                {selectedUser.isActive ? (
                  <TouchableOpacity
                    onPress={() => {
                      handleDeactivateUser(selectedUser);
                      setShowEditModal(false);
                    }}
                    className="bg-orange-100 px-3 py-2 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="pause" size={16} className="text-orange-800! mr-1" />
                    <Text className="text-orange-800 text-sm">Deactivate</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      handleActivateUser(selectedUser);
                      setShowEditModal(false);
                    }}
                    className="bg-green-100 px-3 py-2 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="play" size={16} className="text-green-800! mr-1" />
                    <Text className="text-green-800 text-sm">Activate</Text>
                  </TouchableOpacity>
                )}
                
                {selectedUser.isAdmin ? (
                  <TouchableOpacity
                    onPress={() => {
                      handleDemoteUser(selectedUser);
                      setShowEditModal(false);
                    }}
                    className="bg-blue-100 px-3 py-2 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="arrow-down" size={16} className="text-blue-800! mr-1" />
                    <Text className="text-blue-800 text-sm">Demote</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      handlePromoteUser(selectedUser);
                      setShowEditModal(false);
                    }}
                    className="bg-purple-100 px-3 py-2 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="arrow-up" size={16} className="text-purple-800! mr-1" />
                    <Text className="text-purple-800 text-sm">Promote</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          
          <View className="flex-row justify-end space-x-2 mt-4">
            <TouchableOpacity
              onPress={() => setShowEditModal(false)}
              className="bg-surface border border-border px-4 py-2 rounded-lg"
            >
              <Text className="text-text">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleUpdateUser}
              className="bg-primary px-4 py-2 rounded-lg"
              disabled={isLoading}
            >
              <Text className="text-white">Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 