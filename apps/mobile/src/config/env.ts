import { Platform } from 'react-native'

const fallback = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api/v1' : 'http://localhost:8000/api/v1'
const configured = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim()

/** 必须在构建时包含 /api/v1；真机请指向开发机的局域网 IP 或公网 HTTPS。 */
export const API_BASE = (configured || fallback).replace(/\/+$/, '')
export const USING_DEFAULT_API_BASE = !configured
