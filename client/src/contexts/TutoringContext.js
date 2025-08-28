import React, {createContext, useContext, useState, useEffect } from 'react';
import apiService from '../utils/apiService';
const TutoringContext = createContext();

export const TutoringProvider = ({children}) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
    const createSession = async (sessionData) => {
        try{
            const response = await apiService.createTutoringRequest(sessionData);
            const newSession = response.data;
            setSessions(prev => [...prev, newSession]);
            return newSession;
        } catch (e){
            const errorMessage = apiService.formatError(e);
            console.error('error fetching tutoring requests', e);
            throw new Error(errorMessage);
        }
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
            console.error('error fetching tutoring requests', e);
            throw new Error(errorMessage);
        } 
    };
    const getSessionsForStudent = (studentId) => {
        return sessions.filter(session => 
            session.Student.id === studentId && session.status === 'active'
        );
    };
    const createOverrideSession = async (sessionData, existingSessionId, overidingTeacher) => {
        try{
            await cancelSession(existingSessionId);

            const newSessionData = {
                ...sessionData,
                priority: 1,
                conflictReason: `Overriden by ${overidingTeacher.name} due to priority day.`
            };
            return await createSession(newSessionData);

        }catch (e){
            console.error("Error overring session", e);
            throw e;
        }
    };
    useEffect(()=>{
        fetchSessions();
    }, []);
    const value = {
        sessions, 
        loading,
        error,
        createSession,
        cancelSession,
        createOverrideSession,
        getSessionsForStudent,
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