import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { Search, Filter, MapPin, Heart, Calendar } from 'lucide-react-native';
import { complaintAPI } from '../services/api';


  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await complaintAPI.getAllComplaints ? complaintAPI.getAllComplaints() : complaintAPI.getCategories();
        // If getAllComplaints exists, use it. Otherwise fallback to getCategories (for legacy code)
        if (res && res.complaints) {
          setComplaints(res.complaints);
        } else if (Array.isArray(res)) {
          setComplaints(res);
        } else {
          setComplaints([]);
        }
      } catch (err) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const categories = ['All', 'Roads & Infrastructure', 'Waste Management', 'Street Lights', 'Water Supply', 'Drainage', 'Parks & Recreation'];
  const statuses = ['All', 'Pending', 'In Review', 'In Progress', 'Resolved'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-red-100';
      case 'In Review': return 'bg-yellow-100';
      case 'In Progress': return 'bg-orange-100';
      case 'Resolved': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-red-700';
      case 'In Review': return 'text-yellow-700';
      case 'In Progress': return 'text-orange-700';
      case 'Resolved': return 'text-green-700';
      default: return 'text-gray-700';
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = (complaint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.area?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || complaint.Category?.name === selectedCategory || complaint.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || complaint.currentStatus === selectedStatus || complaint.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <View className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="mb-6">
          <Text className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Complaints Feed</Text>
          <Text className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Browse all reported issues in your city
          </Text>
        </View>

        {/* Loading/Error State */}
        {loading && (
          <View className="items-center py-12">
            <Text className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading complaints...</Text>
          </View>
        )}
        {error && (
          <View className="items-center py-12">
            <Text className={`text-lg ${darkMode ? 'text-red-400' : 'text-red-500'}`}>Error: {error}</Text>
          </View>
        )}
        {!loading && !error && <>
        {/* Search and Filters */}
        <View className="mb-6">
          {/* Search Bar */}
          <View className={`flex-row items-center border rounded-lg px-3 py-2 mb-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
            <Search size={20} color={darkMode ? '#9CA3AF' : '#9CA3AF'} />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search by category or location..."
              placeholderTextColor={darkMode ? '#9CA3AF' : '#6B7280'}
              className={`flex-1 ml-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            />
          </View>

          {/* Filter Toggle */}
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className={`flex-row items-center self-start px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          >
            <Filter size={20} color={darkMode ? '#D1D5DB' : '#374151'} />
            <Text className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Filters</Text>
          </TouchableOpacity>

          {/* Filter Options */}
          {showFilters && (
            <View className={`mt-4 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <Text className={`text-sm mb-2 font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {/* ...existing code... */}
              </View>

              <Text className={`text-sm mb-2 font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</Text>
              <View className="flex-row flex-wrap gap-2">
                {/* ...existing code... */}
              </View>
            </View>
          )}
        </View>

        {/* Results Count */}
        <Text className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? 's' : ''}
        </Text>

        {/* Complaints Grid */}
        <View className="gap-6">
          {filteredComplaints.map((complaint) => (
            <TouchableOpacity
              key={complaint.id}
              onPress={() => navigation?.navigate('Complaint', { id: complaint.id })}
              className={`rounded-xl shadow-md overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              {/* Image */}
              <View className="h-48 relative">
                <Image
                  source={{ uri: complaint.images?.[0]?.imageURL || complaint.image || '' }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className={`absolute top-3 right-3 px-3 py-1 rounded-full ${getStatusColor(complaint.currentStatus || complaint.status)}`}>
                  <Text className={`text-xs font-bold ${getStatusTextColor(complaint.currentStatus || complaint.status)}`}>{complaint.currentStatus || complaint.status}</Text>
                </View>
              </View>

              {/* Content */}
              <View className="p-4">
                <Text className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {complaint.title}
                </Text>

                <View className="self-start px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-3">
                   <Text className="text-[#1E88E5] text-xs">{complaint.Category?.name || complaint.category}</Text>
                </View>

                <View className="flex-row items-center gap-2 mb-2">
                  <MapPin size={16} color={darkMode ? '#9CA3AF' : '#4B5563'} />
                  <Text className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{complaint.area || complaint.location || ''}</Text>
                </View>

                <View className={`flex-row justify-between pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <View className="flex-row items-center gap-2">
                    <Heart size={16} color={darkMode ? '#9CA3AF' : '#4B5563'} />
                    <Text className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{complaint.upvotes} upvotes</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Calendar size={16} color={darkMode ? '#9CA3AF' : '#4B5563'} />
                    <Text className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : ''}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* No Results */}
        {filteredComplaints.length === 0 && (
          <View className="items-center py-12">
            <Text className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No complaints found matching your criteria</Text>
          </View>
        )}
        </>}
      </ScrollView>
      <BottomNav navigation={navigation} />
    </View>
  );
}