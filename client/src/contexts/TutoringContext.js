import React, {createContext, useContext, useState, useEffect } from 'react';
import apiService from '../utils/apiService';
const TutoringContext = createContext();

export const TutoringProvider = ({children}) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [conflictDetails, setConflictDetails] = useState(null);

    const fetchSessions = async () => {
        setLoading(true);
        setError(null);
        try{
            const response = await apiService.getTutoringRequests();
            setSessions(response.data);
        } catch (e){
            const errorMessage = apiService.formatError(e);
            setError(errorMessage);
            console.error('error fetching tutoring requests', e);
        } finally {
            setLoading(false);
        }
    };

    // UPDATED: Enhanced createSession that handles conflicts
    const createSession = async (sessionData) => {
        try{
            setError(null);
            setConflictDetails(null);
            
            const response = await apiService.createTutoringRequest(sessionData);
            const newSession = response.data;
            
            // Handle successful response (might include override info)
            if (response.data.overrideInfo) {
                console.log('Override successful:', response.data.overrideInfo);
            }
            
            setSessions(prev => [...prev, newSession]);
            return { success: true, session: newSession };
            
        } catch (e) {
            // Check if this is an overridable conflict
            if (apiService.isOverridableConflict(e)) {
                const conflict = apiService.getConflictDetails(e);
                setConflictDetails({
                    ...conflict,
                    originalRequestData: sessionData // Store the original request
                });
                
                return { 
                    success: false, 
                    requiresOverride: true, 
                    conflictDetails: conflict 
                };
            } else {
                // Handle other errors normally
                const errorMessage = apiService.formatError(e);
                setError(errorMessage);
                console.error('error creating tutoring request', e);
                throw new Error(errorMessage);
            }
        }
    };

    // NEW: Handle override confirmation
    const confirmOverride = async () => {
        if (!conflictDetails || !conflictDetails.originalRequestData) {
            throw new Error('No conflict data available for override');
        }

        try {
            setError(null);
            const response = await apiService.createTutoringRequestWithOverride(
                conflictDetails.originalRequestData
            );
            
            const newSession = response.data.request || response.data;
            setSessions(prev => [...prev, newSession]);
            
            // Clear conflict state
            setConflictDetails(null);
            
            return { 
                success: true, 
                session: newSession, 
                overrideInfo: response.data.overrideInfo 
            };
            
        } catch (e) {
            const errorMessage = apiService.formatError(e);
            setError(errorMessage);
            console.error('error confirming override', e);
            throw new Error(errorMessage);
        }
    };

    const dismissOverride = () => {
        setConflictDetails(null);
    };

    const cancelSession = async (sessionId) =>{
        try{
            const response = await apiService.cancelTutoringRequest(sessionId);
            setSessions(prev => prev.map(session =>
                session.id===sessionId
                ?{...session, status:'cancelled'}
                : session
            ));
            return response.data;
        } catch (e){
            const errorMessage = apiService.formatError(e);
            console.error('error cancelling tutoring request', e);
            throw new Error(errorMessage);
        } 
    };

    const getSessionsForStudent = (studentId) => {
        return sessions.filter(session => 
            session.Student.id === studentId && session.status === 'active'
        );
    };

    const checkPriorityForDate = async (date) => {
        try {
            const response = await apiService.checkPriorityForDate(date);
            return response.data;
        } catch (e) {
            console.error('Error checking priority for date', e);
            return null;
        }
    };

    useEffect(()=>{
        fetchSessions();
    }, []);

    const value = {
        sessions, 
        loading,
        error,
        conflictDetails, 
        createSession, 
        confirmOverride, 
        dismissOverride, 
        cancelSession,
        getSessionsForStudent,
        checkPriorityForDate, 
        refreshSessions: fetchSessions
    };

    return (
        <TutoringContext.Provider value={value}>
            {children}
        </TutoringContext.Provider>
    );
};

export const useTutoring = () => {
    const context = useContext(TutoringContext);
    if(!context){
        throw new Error('useTutoring must be used within a Tutoring Provider');
    }
    return context;
}