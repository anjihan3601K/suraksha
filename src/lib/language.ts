

// This is a placeholder for a real translation implementation (e.g., using i18next)
const translations: Record<string, string> = {
    suraksha_portal: "Suraksha Portal",
    emergency_response_portal: "Emergency Response Portal",
    government_of_india: "Government of India",
    suraksha_menu: "Suraksha Menu",
    dashboard_navigation: "Dashboard Navigation",
    main_navigation: "Main Navigation",
    dashboard: "Dashboard",
    alerts_and_notifications: "Alerts & Notifications",
    my_reports: "My Reports",
    safety_center: "Safety Center",
    tools_and_features: "Tools & Features",
    safe_path_guide: "Safe Path Guide",
    community_help: "Community Help",
    profile_settings: "Profile Settings",
    emergency_contacts: "Emergency Contacts",
    police: "Police",
    fire: "Fire",
    medical: "Medical",
    emergency: "Emergency",
    logout: "Logout",
    emergency_dashboard: "Emergency Dashboard",
    dashboard_desc: "Monitor your safety and access critical services.",
    alerts_desc: "Review all official alerts and notifications.",
    reports_desc: "View and manage your submitted reports.",
    report_incident: "Report an Incident",
    report_incident_desc: "Submit a photo and description of an incident to officials.",
    safety_desc: "Access safety tools and information.",
    safepath_desc: "Find the safest route to a help center.",
    community_desc: "Connect with your community for help.",
    profile_desc: "Manage your personal information and settings.",
    voice_assistance: "Voice Assistance",
    ai_safety_index: "AI Safety Index",
    // EmergencyControls
    "emergency_controls_title": "Emergency Controls",
    "emergency_controls_description": "Take immediate action to ensure your safety.",
    "sos_text": "Emergency SOS",
    "safe_text": "I Am Safe",
    "contacts_text": "Contacts",

};

export function t(key: string): string {
  return translations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
