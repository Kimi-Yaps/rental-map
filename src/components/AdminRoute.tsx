
import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { IonSpinner } from '@ionic/react';

interface AdminRouteProps {
  component: React.ComponentType<any>;
  path: string;
  exact?: boolean;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ component: Component, ...rest }) => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <IonSpinner />;
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAdmin() ? (
          <Component {...props} />
        ) : (
          <Redirect to="/home" />
        )
      }
    />
  );
};

export default AdminRoute;
