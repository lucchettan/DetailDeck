
import { supabase } from './supabaseClient';
import { IS_MOCK_MODE } from './env';

// Define the types of events we want to track for type safety.
type AnalyticsEvent = 'page_view' | 'cta_click_preorder' | 'cta_click_waitinglist';

/**
 * Tracks a specific analytics event by sending it to the Supabase database.
 * In mock mode, it logs the event to the console instead of sending it.
 * @param eventType - The type of event to track.
 */
export const trackEvent = async (eventType: AnalyticsEvent): Promise<void> => {
  if (IS_MOCK_MODE) {
    console.log(`%c[Analytics MOCK]%c Tracking event: ${eventType}`, 'color: purple; font-weight: bold;', 'color: inherit;');
    return;
  }

  try {
    const { error } = await supabase.from('analytics_events').insert({
      event_type: eventType,
      page_path: window.location.pathname,
    });

    if (error) {
      // Log the error but don't disrupt the user experience.
      console.error('Error tracking analytics event:', error.message);
    }
  } catch (error) {
    console.error('An unexpected error occurred while tracking an event:', error);
  }
};