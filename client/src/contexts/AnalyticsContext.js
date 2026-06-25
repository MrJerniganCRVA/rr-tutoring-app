import React, {createContext, useContext, useState, useCallback } from 'react';
import apiService from '../utils/apiService';

const AnalyticsContext = createContext();

export const AnalyticsProvider = ({children}) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAnalytics = useCallback(async (teacherId) =>{
        setLoading(true);
        setError(null);
        try{
            const response = await apiService.getTeacherAnalytics(teacherId);
            setAnalytics(response.data);
        } catch(e){
            const errorMessage = apiService.formatError(e);
            console.error('Error fetching analytics: ', errorMessage);
        } finally {
            setLoading(false);
        }
    }, []); //this function doesn't change
    const fetchStudentHistory = useCallback(async (teacherId, studentId) =>{
        setLoading(true);
        setError(null);
        try{
            const response = await apiService.getStudentHistory(teacherId, studentId);
            return response.data;
        } catch (e){
            const errorMessage = apiService.formatError(e);
            setError(errorMessage);
            console.error('Error fetching student history: ',e);
        } finally{
            setLoading(false);
        }
    }, []); //this function doesn't change
    const value = {
        analytics,
        loading,
        error,
        fetchAnalytics,
        fetchStudentHistory
    }
    return (
    <AnalyticsContext.Provider value={value}>
        {children}
    </AnalyticsContext.Provider>
    
    );
};
export const useAnalytics = () => {
    const context = useContext(AnalyticsContext);
    if(!context){
        throw new Error('useAnalytics must be used within an Analytics Provider');
    }
    return context;
}
