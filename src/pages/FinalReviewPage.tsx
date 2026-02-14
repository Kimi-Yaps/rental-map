import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonTitle,
  IonText,
  IonButton,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonLoading,
} from '@ionic/react';
import NavigationButtons from '../components/NavigationButtons';
import { Property as DbProperty, RoomDetails } from '../interfaces/DbCrud';
import { useIonRouter } from '@ionic/react';
import ConditionalHeader from '../components/ConditionalHeader';
import supabase from '../supabaseClient';

// Extend the DbProperty interface to include client-side fields like 'rooms'
interface Property extends DbProperty {
  rooms?: RoomDetails[]; // Add rooms array for client-side handling
  HomeType?: string; // Add HomeType for backward compatibility
}

interface PropertyValidationFields {
  property_type: DbProperty['property_type'] | undefined;
  address: DbProperty['address'] | undefined;
  city: DbProperty['city'] | undefined;
  state: DbProperty['state'] | undefined;
  postal_code: DbProperty['postal_code'] | undefined;
  bathrooms: DbProperty['bathrooms'] | undefined;
  bedrooms: DbProperty['bedrooms'] | undefined;
  pricetype: DbProperty['pricetype'] | undefined;
}

// The main application component.
const FinalReviewPage: React.FC = () => {
  const [property, setProperty] = useState<Property | null>(null);
  const ionRouter = useIonRouter();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const loadPropertyData = async () => {
      try {
        // Get the current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setToastMessage('Please login to publish a property');
          setShowToast(true);
          ionRouter.push('/login', 'root');
          return;
        }

        // Get property owner details
        const { data: ownerData, error: ownerError } = await supabase
          .from('property_owners')
          .select('id')
          .eq('id', user.id)
          .single();

        if (ownerError || !ownerData) {
          setToastMessage('Please complete your property owner profile first');
          setShowToast(true);
          ionRouter.push('/profile/landlord', 'root');
          return;
        }

        // Load property draft from localStorage
        const saved = localStorage.getItem('Property');
        if (saved) {
          try {
            const parsedProperty = JSON.parse(saved);
            console.log('Raw localStorage data:', parsedProperty);
            
            // Inject the owner_id
            parsedProperty.owner_id = ownerData.id;

            // CRITICAL: Handle property_type mapping FIRST before any validation
            if (!parsedProperty.property_type) {
              if (parsedProperty.HomeType) {
                parsedProperty.property_type = parsedProperty.HomeType;
                console.log(`Mapped HomeType "${parsedProperty.HomeType}" to property_type`);
              } else {
                console.warn('No property_type or HomeType found in localStorage');
              }
            }
            
            // Calculate total bathrooms and format bedrooms from the rooms array
            let totalBathrooms = 0;
            const formattedBedrooms: Record<string, RoomDetails> = {};
            if (parsedProperty.rooms && Array.isArray(parsedProperty.rooms)) {
              parsedProperty.rooms.forEach((room: RoomDetails, index: number) => {
                if (room.room_type === 'bathroom' && room.number_of_bathrooms) {
                  totalBathrooms += room.number_of_bathrooms;
                } else if (room.room_type === 'bedroom') {
                  formattedBedrooms[`room_${index}`] = room;
                }
              });
            }

            // Assign calculated bathrooms and formatted bedrooms
            parsedProperty.bathrooms = totalBathrooms;
            parsedProperty.bedrooms = formattedBedrooms;

            console.log('Processed property data:', {
              property_type: parsedProperty.property_type,
              HomeType: parsedProperty.HomeType,
              address: parsedProperty.address,
              bathrooms: parsedProperty.bathrooms,
              bedrooms: Object.keys(parsedProperty.bedrooms || {}).length,
              pricetype: parsedProperty.pricetype
            });

            // NOW validate required fields after all processing
            const requiredFieldsForValidation: PropertyValidationFields = {
              property_type: parsedProperty.property_type,
              address: parsedProperty.address,
              city: parsedProperty.city,
              state: parsedProperty.state,
              postal_code: parsedProperty.postal_code,
              bathrooms: parsedProperty.bathrooms,
              bedrooms: parsedProperty.bedrooms,
              pricetype: parsedProperty.pricetype
            };

            const missingFields = Object.entries(requiredFieldsForValidation)
              .filter(([key, value]) => {
                if (key === 'bathrooms') {
                  return typeof value !== 'number' || value <= 0;
                }
                if (key === 'bedrooms') {
                  return !value || Object.keys(value).length === 0;
                }
                return !value;
              })
              .map(([key]) => key);
            
            if (missingFields.length > 0) {
              setValidationErrors(missingFields);
              console.warn('Missing required fields after processing:', missingFields);
            } else {
              setValidationErrors([]);
              console.log('All required fields are present');
            }
            
            setProperty(parsedProperty);
          } catch (e) {
            console.error("Failed to parse Property from localStorage", e);
            setProperty(null);
          }
        } else {
          console.log("No property found in localStorage.");
        }
      } catch (error) {
        console.error("Error loading property data:", error);
        setToastMessage('Failed to load property data');
        setShowToast(true);
      }
    };

    loadPropertyData();
  }, [ionRouter]);

  const handleBack = () => {
    ionRouter.push('/photos', 'back');
  };

  const handlePublish = async () => {
    if (!property) {
      setToastMessage('No property data found');
      setShowToast(true);
      return;
    }

    setIsPublishing(true);
    try {
      console.log('Starting publish process with property:', property);
      
      // Ensure property_type is set
      let finalPropertyType = property.property_type;
      if (!finalPropertyType && property.HomeType) {
        finalPropertyType = property.HomeType;
        console.log('Using HomeType as property_type:', finalPropertyType);
      }

      if (!finalPropertyType) {
        throw new Error('Property type is required but not found');
      }

      // Recalculate bathrooms and bedrooms from the current property state for publishing
      let totalBathrooms = property.bathrooms || 0;
      let formattedBedrooms = property.bedrooms || {};

      // If we have rooms data, recalculate
      if (property.rooms && Array.isArray(property.rooms)) {
        totalBathrooms = 0;
        formattedBedrooms = {};
        property.rooms.forEach((room: RoomDetails, index: number) => {
          if (room.room_type === 'bathroom' && room.number_of_bathrooms) {
            totalBathrooms += room.number_of_bathrooms;
          } else if (room.room_type === 'bedroom') {
            formattedBedrooms[`room_${index}`] = room;
          }
        });
      }

      // Final validation before publishing
      const finalData: PropertyValidationFields & { owner_id: string | undefined } = {
        owner_id: property.owner_id,
        property_type: finalPropertyType,
        address: property.address,
        city: property.city,
        state: property.state,
        postal_code: property.postal_code,
        bathrooms: totalBathrooms,
        bedrooms: formattedBedrooms,
        pricetype: property.pricetype
      };

      console.log('Final data for publishing:', finalData);

      const missingFields = Object.entries(finalData)
        .filter(([key, value]) => {
          if (key === 'bathrooms') {
            return typeof value !== 'number' || value <= 0;
          }
          if (key === 'bedrooms') {
            return !value || Object.keys(value as Record<string, RoomDetails>).length === 0;
          }
          return !value;
        })
        .map(([key]) => key);

      if (missingFields.length > 0) {
        console.error('Missing fields at publish time:', missingFields);
        setValidationErrors(missingFields);
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }
      
      setValidationErrors([]);

      const propertyData = {
        owner_id: property.owner_id,
        description: property.description || '', // Ensure description is an empty string, not null
        address: property.address,
        city: property.city, // Now required
        state: property.state, // Now required
        postal_code: property.postal_code, // Now required
        property_type: finalPropertyType,
        bathrooms: totalBathrooms,
        bedrooms: formattedBedrooms,
        pricetype: property.pricetype
      };

      console.log('Inserting property data:', propertyData);

      const { error } = await supabase
        .from('properties')
        .insert([propertyData]);

      if (error) {
        console.error('Database error:', error);
        if (error.code === '23502') { // Not null violation
          throw new Error('Missing required property information. Please check all fields are filled.');
        }
        throw error;
      }

      // Delete the draft after successful publish
      if (property.id) {
        await supabase
          .from('rental_drafts')
          .delete()
          .eq('id', property.id)
          .eq('owner_id', property.owner_id);
      }

      setToastMessage('Property successfully published!');
      setShowToast(true);
      
      // Clear the draft from localStorage
      localStorage.removeItem('Property');
      
      // Redirect to landlord dashboard or success page
      setTimeout(() => {
        ionRouter.push('/landlord', 'root');
      }, 2000);

    } catch (error) {
      console.error('Error publishing property:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish property. Please try again.';
      setToastMessage(errorMessage);
      setShowToast(true);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <IonPage>
      <ConditionalHeader color="primary">
            <IonTitle>Review & Publish Property</IonTitle>
      </ConditionalHeader>
      <IonContent fullscreen className="ion-padding">
        <IonLoading
          isOpen={isPublishing}
          message="Publishing your property..."
        />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={4000}
          position="top"
          color={toastMessage.includes('success') ? 'success' : 'danger'}
        />
        <IonGrid>
          <IonRow className="ion-align-items-center ion-margin-bottom">
            <IonCol size="auto">
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--ion-color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ion-color-primary-contrast)',
                fontWeight: 'bold',
                marginRight: '10px'
              }}>
                6
              </div>
            </IonCol>
            <IonCol>
              <IonText color="primary">
                <h2>Review Your Listing</h2>
              </IonText>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <IonText color="medium">
                <p>Please review all the details you've entered before publishing your property.</p>
              </IonText>
              {validationErrors.length > 0 && (
                <IonCard color="danger" className="ion-margin-top">
                  <IonCardContent>
                    <IonText color="light">
                      <h2>Please complete the following required fields:</h2>
                      <ul>
                        {validationErrors.map((field, index) => (
                          <li key={index}>
                            {field.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                            {field === 'property_type' && (
                              <span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                (Go back to Property Type selection)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              )}
            </IonCol>
          </IonRow>

          {property ? (
            <IonRow>
              <IonCol size="12">
                <IonCard className="ion-margin-top">
                  <IonCardContent>
                    <IonText>
                      <h3>Property Details</h3>
                    <p><strong>Property Type:</strong> {property.property_type || property.HomeType || 'Not specified'}</p>
                      <p><strong>Description:</strong> {property.description || 'N/A'}</p>
                      <p><strong>Address:</strong> {[
                        property.address,
                        property.city,
                        property.state,
                        property.postal_code
                      ].filter(Boolean).join(', ') || 'N/A'}</p>
                      <p><strong>Size:</strong> {property.size_sqft ? `${property.size_sqft} sqft` : 'N/A'}</p>
                      <p><strong>Bathrooms:</strong> {property.bathrooms || 0}</p>
                      <p><strong>Availability:</strong> {property.is_available ? 'Available' : 'Not Available'}</p>
                    </IonText>

                    {/* Debug Information Card */}
                    {process.env.NODE_ENV === 'development' && (
                      <IonCard color="light" className="ion-margin-top">
                        <IonCardContent>
                          <IonText>
                            <h4>Debug Info</h4>
                            <p><strong>property_type:</strong> {property.property_type || 'undefined'}</p>
                            <p><strong>HomeType:</strong> {property.HomeType || 'undefined'}</p>
                            <p><strong>Has address:</strong> {property.address ? 'Yes' : 'No'}</p>
                            <p><strong>Has pricetype:</strong> {property.pricetype ? 'Yes' : 'No'}</p>
                            <p><strong>Bedrooms count:</strong> {Object.keys(property.bedrooms || {}).length}</p>
                          </IonText>
                        </IonCardContent>
                      </IonCard>
                    )}

                    {property.amenities && (
                      <IonText className="ion-margin-top">
                        <h3>Amenities</h3>
                        <ul>
                          {property.amenities.wifi_included && <li>Wi-Fi</li>}
                          {property.amenities.air_conditioning && <li>Air Conditioning</li>}
                          {property.amenities.in_unit_laundry && <li>In-unit Laundry</li>}
                          {property.amenities.dishwasher && <li>Dishwasher</li>}
                          {property.amenities.balcony_patio && <li>Balcony/Patio</li>}
                          {property.amenities.community_pool && <li>Community Pool</li>}
                          {property.amenities.fitness_center && <li>Fitness Center</li>}
                          {property.amenities.pet_friendly && (property.amenities.pet_friendly.dogs_allowed || property.amenities.pet_friendly.cats_allowed) && (
                            <li>
                              Pet Friendly ({[
                                property.amenities.pet_friendly.dogs_allowed ? 'Dogs' : '',
                                property.amenities.pet_friendly.cats_allowed ? 'Cats' : ''
                              ].filter(Boolean).join(' & ')})
                            </li>
                          )}
                          {property.amenities.parking?.type && (
                            <li>Parking: {property.amenities.parking.type} ({property.amenities.parking.spots ?? 'N/A'} spots)</li>
                          )}
                        </ul>
                      </IonText>
                    )}

                    {property.bedrooms && Object.keys(property.bedrooms).length > 0 && (
                      <IonText className="ion-margin-top">
                        <h3>Rooms</h3>
                        {Object.entries(property.bedrooms).map(([roomId, room], index) => (
                          <div key={roomId} style={{ marginBottom: '10px', borderBottom: '1px solid var(--ion-color-medium)', paddingBottom: '10px' }}>
                            <p><strong>Room {index + 1}: {room.room_type}</strong></p>
                            {room.description && <p>Description: {room.description}</p>}
                            {room.bed_counts && <p>Bed Configuration: {
                              Object.entries(room.bed_counts)
                                .map(([type, count]) => `${count} ${type}`)
                                .join(', ')
                            }</p>}
                            {room.has_ensuite && <p>Ensuite Bathroom</p>}
                            {room.number_of_bathrooms && <p>Bathrooms: {room.number_of_bathrooms}</p>}
                          </div>
                        ))}
                      </IonText>
                    )}

                    {property.pricetype && (
                      <IonText className="ion-margin-top">
                        <h3>Pricing</h3>
                        <div style={{ marginBottom: '10px', borderBottom: '1px solid var(--ion-color-medium)', paddingBottom: '10px' }}>
                          <p><strong>Monthly Rent:</strong> {property.pricetype.monthly_rent} {property.pricetype.currency}</p>
                          {property.pricetype.security_deposit && 
                            <p><strong>Security Deposit:</strong> {property.pricetype.security_deposit} {property.pricetype.currency}</p>
                          }
                          {property.pricetype.utilities_deposit && 
                            <p><strong>Utilities Deposit:</strong> {property.pricetype.utilities_deposit} {property.pricetype.currency}</p>
                          }
                          {property.pricetype.other_fees?.map((fee, index) => (
                            <p key={index}><strong>{fee.name}:</strong> {fee.amount} {property.pricetype?.currency}</p>
                          ))}
                        </div>
                      </IonText>
                    )}

                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          ) : (
            <IonRow>
              <IonCol size="12">
                <IonCard color="warning" className="ion-margin-top">
                  <IonCardContent>
                    <IonText color="var(--ion-color-warning-contrast)">
                      <p>No draft property data found. Please go back to previous steps to create a listing.</p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          )}
        </IonGrid>
        <IonGrid className="ion-padding">
          <IonRow className="ion-align-items-center ion-justify-content-between">
            <IonCol size-xs="12" size-md="12">
              <NavigationButtons
                onBack={handleBack}
                backPath="/photos"
                showNextButton={false}
                rightButton={
                  <IonButton 
                    expand="block" 
                    size="default" 
                    onClick={handlePublish}
                    disabled={!property || validationErrors.length > 0}
                    color={validationErrors.length > 0 ? 'danger' : 'primary'}
                  >
                    {validationErrors.length > 0 ? 'Complete Required Fields' : 'Publish Property'}
                  </IonButton>
                }
              />
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default FinalReviewPage;
