import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth Hook
 * 
 * A convenience hook that provides access to the AuthContext.
 * Must be used within an AuthProvider.
 * 
 * @example
 * function MyComponent() {
 *   const { user, signOut } = useAuth();
 *   
 *   if (!user) return <div>Not logged in</div>;
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user.email}</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;
