import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonText,
  IonItem,
  IonLabel,
  IonIcon,
  IonImg,
  IonRouterLink,
  IonButton
} from "@ionic/react";
import { Fragment, useState, useEffect } from "react";
import "./Main.scss"; // Assuming common styles can be reused
import supabase from "../supabaseConfig";
import { Icons } from "../utils/homeAssets"; // Import Icons from utils/homeAssets

// Define interfaces for better type safety
interface PersonalInfo {
  userEmail?: string;
  contactNumber?: string;
  countryOfResidence?: string;
  sex?: string;
  dateOfBirth?: string;
}

interface TravelDocument {
  type: string;
  name: string;
  number: string;
  expiry: string;
}

interface Availability {
  outOfOfficePeriods?: {
    start: string;
    end: string;
    backupApprover?: string;
  }[];
}

interface ProfileData {
  id: string;
  full_name?: string;
  avatar_url?: string;
  nickname?: string;
  userType?: any; // Keeping as any for now, as its structure is unclear from context
  created_at: string;
  updated_at: string;
  personalInfo?: PersonalInfo;
  availability?: Availability;
  travelDocuments?: TravelDocument[];
}
>>>>>>> Stashed changes
// Placeholder for profile-specific assets if any
export const getProfileAssetUrls = () => ({
  // Add profile specific assets here if needed
});

const Profile: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null); // Use defined interface
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Assuming we can get the user's ID from Supabase Auth
        // In a real app, you'd get this from the auth state
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not logged in");
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(); // Use single() as we expect one profile per user ID

        if (error) {
          throw error;
        }

        if (data) {
          setProfileData(data as ProfileData); // Type assertion here
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.message || "Failed to fetch profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <IonPage id="main-content" style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
        <IonContent style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
          <IonGrid className="ion-text-center ion-padding">
            <IonText>Loading profile...</IonText>
          </IonGrid>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage id="main-content" style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
        <IonContent style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
          <IonGrid className="ion-text-center ion-padding">
            <IonText color="danger">Error: {error}</IonText>
          </IonGrid>
        </IonContent>
      </IonPage>
    );
  }

  // If profileData is null or empty after loading, it might mean no profile exists for the user
  if (!profileData) {
    return (
      <IonPage id="main-content" style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
        <IonContent style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
          <IonGrid className="ion-text-center ion-padding">
            <IonText>Profile not found.</IonText>
            {/* Optionally, provide a way to create a profile */}
          </IonGrid>
        </IonContent>
      </IonPage>
    );
  }

  // Extracting data for easier access
  const {
    full_name,
    avatar_url,
    nickname,
    userType, // This is jsonb, might need specific handling
    created_at,
    updated_at
  } = profileData;

  // Simplified completion progress based on available fields
  const completionFields = [
    "First name and last name",
    "Contact number",
    "Country of residence",
    "Sex",
    "Date of birth",
    "Travel document",
    "Nickname" // Added nickname as it's in the schema
  ];
  const completedFieldsCount = completionFields.filter(field => {
    // Basic check for completion - adjust logic as needed
    if (field === "First name and last name" && full_name) return true;
    if (field === "Contact number" && profileData.personalInfo?.contactNumber) return true; // Assuming personalInfo structure might be mapped later
    if (field === "Country of residence" && profileData.personalInfo?.countryOfResidence) return true;
    if (field === "Sex" && profileData.personalInfo?.sex) return true;
    if (field === "Date of birth" && profileData.personalInfo?.dateOfBirth) return true;
    if (field === "Travel document" && profileData.travelDocuments?.length > 0) return true;
    if (field === "Nickname" && nickname) return true;
    return false;
  }).length;

  const initials = full_name ? full_name.split(' ').map((n: string) => n[0]).join('') : nickname ? nickname[0] : 'U';

  return (
    <IonPage id="main-content" style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
      <IonContent style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
        {/* Header with Back button */}
        <IonGrid className="profile-header-row">
          <IonRow className="ion-align-items-center">
            <IonCol size="auto" className="ion-no-padding">
              <IonRouterLink routerLink="/home" className="no-style-link profile-back-button">
                <IonIcon src={Icons.home} className="cust-icon"></IonIcon> {/* Assuming home icon for back */}
                <IonText>Back</IonText>
              </IonRouterLink>
            </IonCol>
            <IonCol className="ion-text-center">
              <IonText className="profile-title">Profile</IonText>
            </IonCol>
            <IonCol size="auto" className="ion-text-right">
              {/* Edit Picture Button */}
              <IonButton fill="clear" className="edit-picture-button">
                <IonText>Edit picture</IonText>
                <IonIcon slot="end" src="public/edit-icon.svg"></IonIcon> {/* Placeholder for edit icon */}
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Profile Picture and Name */}
        <IonGrid className="profile-info-section">
          <IonRow className="ion-justify-content-center ion-align-items-center">
            <IonCol size="auto" className="profile-picture-container">
              {avatar_url ? (
                <IonImg src={avatar_url} alt="Profile Picture" className="profile-picture" />
              ) : (
                <div className="profile-picture-initials">{initials}</div>
              )}
            </IonCol>
            <IonCol>
              <IonText className="profile-full-name">{full_name || nickname || 'User'}</IonText>
              <IonText className="profile-last-update">Last updated: {new Date(updated_at || created_at || Date.now()).toLocaleString()}</IonText>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Complete your profile section */}
        <IonGrid className="profile-completion-section">
          <IonRow>
            <IonCol>
              <IonText className="completion-progress-text">{completedFieldsCount}/{completionFields.length}</IonText>
              <IonText className="completion-title">Complete your profile</IonText>
              <IonText className="completion-subtitle">Speed up the booking process by adding your details to your profile.</IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              {completionFields.map((field, index) => { // Added type for index
                // Basic logic to determine if a field is considered 'completed'
                let isCompleted = false;
                if (field === "First name and last name" && full_name) isCompleted = true;
                if (field === "Contact number" && profileData.personalInfo?.contactNumber) isCompleted = true;
                if (field === "Country of residence" && profileData.personalInfo?.countryOfResidence) isCompleted = true;
                if (field === "Sex" && profileData.personalInfo?.sex) isCompleted = true;
                if (field === "Date of birth" && profileData.personalInfo?.dateOfBirth) isCompleted = true;
                if (field === "Travel document" && profileData.travelDocuments?.length > 0) isCompleted = true;
                if (field === "Nickname" && nickname) isCompleted = true;

                return (
                  <Fragment key={index}>
                    <IonItem lines="none" className="completion-field-item">
                      <IonIcon src={isCompleted ? "public/checkmark-circle-filled.svg" : "public/checkmark-circle-outline.svg"} className="checkmark-icon"></IonIcon> {/* Placeholder */}
                      <IonLabel>{field}</IonLabel>
                      <IonIcon src="public/info-icon.svg" className="info-icon"></IonIcon> {/* Placeholder */}
                    </IonItem>
                  </Fragment>
                );
              })}
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Personal Info Section */}
        <IonGrid className="profile-section">
          <IonRow className="section-header">
            <IonCol>
              <IonText className="section-title">Personal</IonText>
            </IonCol>
            <IonCol className="ion-text-right">
              <IonButton fill="clear" className="edit-button">Edit</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <IonText className="info-label">User email</IonText>
            </IonCol>
            <IonCol>
              <IonText className="info-value">{profileData.personalInfo?.userEmail || 'Not provided'}</IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <IonText className="info-label">Date of birth</IonText>
            </IonCol>
            <IonCol>
              <IonText className="info-value">{profileData.personalInfo?.dateOfBirth || 'Not provided'}</IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <IonText className="info-label">Sex</IonText>
            </IonCol>
            <IonCol>
              <IonText className="info-value">{profileData.personalInfo?.sex || 'Not provided'}</IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <IonText className="info-label">Country of residence</IonText>
            </IonCol>
            <IonCol>
              <IonText className="info-value">{profileData.personalInfo?.countryOfResidence || 'Not provided'}</IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <IonText className="info-label">Contact number</IonText>
            </IonCol>
            <IonCol>
              <IonText className="info-value">{profileData.personalInfo?.contactNumber || 'Not provided'}</IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <IonText className="info-label">Role</IonText>
            </IonCol>
            <IonCol>
              <IonText className="info-value">{userType ? JSON.stringify(userType) : 'Not provided'}</IonText> {/* Display userType */}
              <IonIcon src="public/info-icon.svg" className="info-icon"></IonIcon> {/* Placeholder */}
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Availability Section */}
        {profileData.availability?.outOfOfficePeriods && profileData.availability.outOfOfficePeriods.length > 0 && (
          <IonGrid className="profile-section">
            <IonRow className="section-header">
              <IonCol>
                <IonText className="section-title">Availability</IonText>
              </IonCol>
              <IonCol className="ion-text-right">
                <IonButton fill="clear" className="edit-button">Set out-of-office</IonButton>
              </IonCol>
            </IonRow>
            {profileData.availability.outOfOfficePeriods.map((period: { start: string; end: string; backupApprover?: string }, index: number) => ( // Added types for period and index
              <Fragment key={index}>
                <IonRow>
                  <IonCol size="4">
                    <IonText className="info-label">Out-of-office periods:</IonText>
                  </IonCol>
                  <IonCol>
                    <IonText className="info-value">{period.start} - {period.end}</IonText>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="4">
                    <IonText className="info-label">Backup approver:</IonText>
                  </IonCol>
                  <IonCol>
                    <IonText className="info-value">{period.backupApprover}</IonText>
                  </IonCol>
                </IonRow>
              </Fragment>
            ))}
            <IonRow>
              <IonCol>
                <IonText className="timezone-info">All the times are adjusted to your current zone (UTC+03:00)</IonText>
              </IonCol>
            </IonRow>
          </IonGrid>
        )}

        {/* Travel Documents Section */}
        {profileData.travelDocuments && profileData.travelDocuments.length > 0 && (
          <IonGrid className="profile-section">
            <IonRow className="section-header">
              <IonCol>
                <IonText className="section-title">Travel documents</IonText>
              </IonCol>
              <IonCol className="ion-text-right">
                <IonButton fill="clear" className="edit-button">Add a travel document</IonButton>
              </IonCol>
            </IonRow>
            {profileData.travelDocuments.map((doc: TravelDocument, index: number) => ( // Added type for doc and index
              <Fragment key={index}>
                <IonRow>
                  <IonCol size="4">
                    <IonText className="info-label">Type</IonText>
                  </IonCol>
                  <IonCol>
                    <IonText className="info-value">{doc.type}</IonText>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="4">
                    <IonText className="info-label">Name</IonText>
                  </IonCol>
                  <IonCol>
                    <IonText className="info-value">{doc.name}</IonText>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="4">
                    <IonText className="info-label">Number</IonText>
                  </IonCol>
                  <IonCol>
                    <IonText className="info-value">{doc.number}</IonText>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="4">
                    <IonText className="info-label">Expires</IonText>
                  </IonCol>
                  <IonCol>
                    <IonText className="info-value">{doc.expiry}</IonText>
                  </IonCol>
                </IonRow>
              </Fragment>
            ))}
          </IonGrid>
        )}

        {/* Other sections like Loyalty programs, Train discount cards, Individual cards would follow a similar pattern */}

      </IonContent>
    </IonPage>
  );
};

export default Profile;
</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.

New problems detected after saving the file:
src/pages/Profile.tsx
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
    Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData'.
      Types of property 'full_name' are incompatible.
        Type 'string | null | undefined' is not assignable to type 'string | undefined'.
- [ts Error] Line 100: Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string | null; }[] | null; } | null; travelDocuments?: { type?: string | null; name?: string | null; number?: string | null; expiry?: string | null; }[] | null; }' is not assignable to type 'ProfileData | null'.
  Type '{ id: string; full_name?: string | null; avatar_url?: string | null; nickname?: string | null; userType?: any; created_at: string; updated_at: string; personalInfo?: { userEmail?: string | null; contactNumber?: string | null; countryOfResidence?: string | null; sex?: string | null; dateOfBirth?: string | null; } | null; availability?: { outOfOfficePeriods?: { start?: string | null; end?: string | null; backupApprover?: string |

// Placeholder for profile-specific assets if any
export const getProfileAssetUrls = () => ({
  // Add profile specific assets here if needed
});

const Profile: React.FC = () => {
  const [profileData, setProfileData] = useState<any>(null); // Use 'any' for now, will refine with types later
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Assuming we can get the user's ID from Supabase Auth
        // In a real app, you'd get this from the auth state
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not logged in");
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(); // Use single() as we expect one profile per user ID

        if (error) {
          throw error;
        }

        if (data) {
          setProfileData(data);
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.message || "Failed to fetch profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <IonPage id="main-content" style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
        <IonContent style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
          <IonGrid className="ion-text-center ion-padding">
            <IonText>Loading profile...</IonText>
          </IonGrid>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage id="main-content" style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
        <IonContent style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
          <IonGrid className="ion-text-center ion-padding">
            <IonText color="danger">Error: {error}</IonText>
          </IonGrid>
        </IonContent>
      </IonPage>
    );
  }

  // If profileData is null or empty after loading, it might mean no profile exists for the user
  if (!profileData) {
    return (
      <IonPage id="main-content" style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
        <IonContent style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
          <IonGrid className="ion-text-center ion-padding">
            <IonText>Profile not found.</IonText>
            {/* Optionally, provide a way to create a profile */}
          </IonGrid>
        </IonContent>
      </IonPage>
    );
  }

  // Extracting data for easier access
  const {
    full_name,
    avatar_url,
    nickname,
    userType, // This is jsonb, might need specific handling
    created_at,
    updated_at
  } = profileData;

  // Simplified completion progress based on available fields
  const completionFields = [
    "First name and last name",
    "Contact number",
    "Country of residence",
    "Sex",
    "Date of birth",
    "Travel document",
    "Nickname" // Added nickname as it's in the schema
  ];
  const completedFieldsCount = completionFields.filter(field => {
    // Basic check for completion - adjust logic as needed
    if (field === "First name and last name" && full_name) return true;
    if (field === "Contact number" && profileData.personalInfo?.contactNumber) return true; // Assuming personalInfo structure might be mapped later
    if (field === "Country of residence" && profileData.personalInfo?.countryOfResidence) return true;
    if (field === "Sex" && profileData.personalInfo?.sex) return true;
    if (field === "Date of birth" && profileData.personalInfo?.dateOfBirth) return true;
    if (field === "Travel document" && profileData.travelDocuments?.length > 0) return true;
    if (field === "Nickname" && nickname) return true;
    return false;
  }).length;

  const initials = full_name ? full_name.split(' ').map((n: string) => n[0]).join('') : nickname ? nickname[0] : 'U';

  return (
    <IonPage id="main-content" style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
      <IonContent style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
        {/* Header with Back button */}
        <IonGrid className="profile-header-row">
          <IonRow className="ion-align-items-center">
            <IonCol size="auto" className="ion-no-padding">
              <IonRouterLink routerLink="/home" className="no-style-link profile-back-button">
                <IonIcon src={Icons.home} className="cust-icon"></IonIcon> {/* Assuming home icon for back */}
                <IonText>Back</IonText>
              </IonRouterLink>
            </IonCol>
            <IonCol className="ion-text-center">
              <IonText className="profile-title">Profile</IonText>
            </IonCol>
            <IonCol size="auto" className="ion-text-right">
              {/* Edit Picture Button */}
              <IonButton fill="clear" className="edit-picture-button">
                <IonText>Edit picture</IonText>
                <IonIcon slot="end" src="public/edit-icon.svg"></IonIcon> {/* Placeholder for edit icon */}
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Profile Picture and Name */}
        <IonGrid className="profile-info-section">
          <IonRow className="ion-justify-content-center ion-align-items-center">
            <IonCol size="auto" className="profile-picture-container">
              {avatar_url ? (
                <IonImg src={avatar_url} alt="Profile Picture" className="profile-picture" />
              ) : (
                <div className="profile-picture-initials">{initials}</div>
              )}
            </IonCol>
            <IonCol>
              <IonText className="profile-full-name">{full_name || nickname || 'User'}</IonText>
              <IonText className="profile-last-update">Last updated: {new Date(updated_at || created_at || Date.now()).toLocaleString()}</IonText>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Complete your profile section */}
        <IonGrid className="profile-completion-section">
          <IonRow>
            <IonCol>
              <IonText className="completion-progress-text">{completedFieldsCount}/{completionFields.length}</IonText>
              <IonText className="completion-title">Complete your profile</IonText>
              <IonText className="completion-subtitle">Speed up the booking process by adding your details to your profile.</IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              {completionFields.map((field, index) => {
                // Basic logic to determine if a field is considered 'completed'
                let isCompleted = false;
                if (field === "First name and last name" && full_name) isCompleted = true;
                if (field === "Contact number" && profileData.personalInfo?.contactNumber) isCompleted = true;
                if (field === "Country of residence" && profileData.personalInfo?.countryOfResidence) isCompleted = true;
                if (field === "Sex" && profileData.personalInfo?.sex) isCompleted = true;
                if (field === "Date of birth" && profileData.personalInfo?.dateOfBirth) isCompleted = true;
                if (field === "Travel document" && profileData.travelDocuments?.length > 0) isCompleted = true;
                if (field === "Nickname" && nickname) isCompleted = true;

                return (
                  <Fragment key={index}>
                    <IonItem lines="none" className="completion-field-item">
                      <IonIcon src={isCompleted ? "public/checkmark-circle-filled.svg" : "public/checkmark-circle-outline.svg"} className="checkmark-icon"></IonIcon> {/* Placeholder */}
                      <IonLabel>{field}</IonLabel>
                      <IonIcon src="public/info-icon.svg" className="info-icon"></IonIcon> {/* Placeholder */}
                    </IonItem>
                  </Fragment>
                );
              })}
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Personal Info Section */}
        <IonGrid className="profile-section">
          <IonRow className="section-header">
            <IonCol>
              <IonText className="section-title">Personal</IonText>
            </IonCol>
            <IonCol className="ion-text-right">
              <IonButton fill="clear" className="edit-button">Edit</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <IonText className="info-label">User email</IonText>
            </IonCol>
            <IonCol>
              <IonText className="info-value">{profileData.personalInfo?.userEmail || 'Not provided'}</IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <IonText className="info-label">Date of birth</IonText>
            </IonCol>
            <IonCol>
              <IonText className="info-value">{profileData.personalInfo?.dateOfBirth || 'Not provided'}</IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <IonText className="info-label">Sex</IonText>
            </IonCol>
            <IonCol>
              <IonText className="info-value">{profileData.personalInfo?.sex || 'Not provided'}</IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <IonText className="info-label">Country of residence</IonText>
            </IonCol>
            <IonCol>
              <IonText className="info-value">{profileData.personalInfo?.countryOfResidence || 'Not provided'}</IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <IonText className="info-label">Contact number</IonText>
            </IonCol>
            <IonCol>
              <IonText className="info-value">{profileData.personalInfo?.contactNumber || 'Not provided'}</IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <IonText className="info-label">Role</IonText>
            </IonCol>
            <IonCol>
              <IonText className="info-value">{userType ? JSON.stringify(userType) : 'Not provided'}</IonText> {/* Display userType */}
              <IonIcon src="public/info-icon.svg" className="info-icon"></IonIcon> {/* Placeholder */}
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Availability Section */}
        {profileData.availability?.outOfOfficePeriods && profileData.availability.outOfOfficePeriods.length > 0 && (
          <IonGrid className="profile-section">
            <IonRow className="section-header">
              <IonCol>
                <IonText className="section-title">Availability</IonText>
              </IonCol>
              <IonCol className="ion-text-right">
                <IonButton fill="clear" className="edit-button">Set out-of-office</IonButton>
              </IonCol>
            </IonRow>
            {profileData.availability.outOfOfficePeriods.map((period, index) => (
              <Fragment key={index}>
                <IonRow>
                  <IonCol size="4">
                    <IonText className="info-label">Out-of-office periods:</IonText>
                  </IonCol>
                  <IonCol>
                    <IonText className="info-value">{period.start} - {period.end}</IonText>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="4">
                    <IonText className="info-label">Backup approver:</IonText>
                  </IonCol>
                  <IonCol>
                    <IonText className="info-value">{period.backupApprover}</IonText>
                  </IonCol>
                </IonRow>
              </Fragment>
            ))}
            <IonRow>
              <IonCol>
                <IonText className="timezone-info">All the times are adjusted to your current zone (UTC+03:00)</IonText>
              </IonCol>
            </IonRow>
          </IonGrid>
        )}

        {/* Travel Documents Section */}
        {profileData.travelDocuments && profileData.travelDocuments.length > 0 && (
          <IonGrid className="profile-section">
            <IonRow className="section-header">
              <IonCol>
                <IonText className="section-title">Travel documents</IonText>
              </IonCol>
              <IonCol className="ion-text-right">
                <IonButton fill="clear" className="edit-button">Add a travel document</IonButton>
              </IonCol>
            </IonRow>
            {profileData.travelDocuments.map((doc, index) => (
              <Fragment key={index}>
                <IonRow>
                  <IonCol size="4">
                    <IonText className="info-label">Type</IonText>
                  </IonCol>
                  <IonCol>
                    <IonText className="info-value">{doc.type}</IonText>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="4">
                    <IonText className="info-label">Name</IonText>
                  </IonCol>
                  <IonCol>
                    <IonText className="info-value">{doc.name}</IonText>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="4">
                    <IonText className="info-label">Number</IonText>
                  </IonCol>
                  <IonCol>
                    <IonText className="info-value">{doc.number}</IonText>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="4">
                    <IonText className="info-label">Expires</IonText>
                  </IonCol>
                  <IonCol>
                    <IonText className="info-value">{doc.expiry}</IonText>
                  </IonCol>
                </IonRow>
              </Fragment>
            ))}
          </IonGrid>
        )}

        {/* Other sections like Loyalty programs, Train discount cards, Individual cards would follow a similar pattern */}

      </IonContent>
    </IonPage>
  );
};

export default Profile;
