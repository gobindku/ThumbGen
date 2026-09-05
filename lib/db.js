// File: lib/db.js
// Simple JSON-based database utilities

import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const sessionsFile = path.join(dataDir, 'sessions.json');

// Initialize data directory and sessions file
const initializeDb = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(sessionsFile)) {
    fs.writeFileSync(sessionsFile, JSON.stringify({}, null, 2));
  }
};

// Read all sessions
export const getSessions = () => {
  initializeDb();
  try {
    const data = fs.readFileSync(sessionsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading sessions:', error);
    return {};
  }
};

// Get a specific session
export const getSession = (sessionId) => {
  const sessions = getSessions();
  return sessions[sessionId] || null;
};

// Save or update a session
export const saveSession = (sessionId, sessionData) => {
  initializeDb();
  try {
    const sessions = getSessions();
    sessions[sessionId] = {
      ...sessions[sessionId],
      ...sessionData,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
    return sessions[sessionId];
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

// Create a new session
export const createSession = (sessionId, baseImage) => {
  const sessionData = {
    id: sessionId,
    baseImage: baseImage,
    variations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return saveSession(sessionId, sessionData);
};

// Update variations in a session
export const updateSessionVariations = (sessionId, variations) => {
  const session = getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  return saveSession(sessionId, {
    variations: variations,
  });
};

// Delete a session
export const deleteSession = (sessionId) => {
  initializeDb();
  try {
    const sessions = getSessions();
    delete sessions[sessionId];
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};
