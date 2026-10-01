import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SCENARIOS } from '@/content/scenarios';
import { findBrokenLinks } from '@/lib/conversation';
import { colors } from '@/lib/theme';
import { EntitlementsProvider } from '@/state/entitlements';
import { PracticeProvider } from '@/state/practice';

// Content integrity check. A dead branch is a blank screen mid-conversation,
// so surface it in the dev console the moment the app boots.
if (__DEV__) {
  for (const scenario of SCENARIOS) {
    if (!scenario.conversation) continue;
    const problems = findBrokenLinks(scenario.conversation);
    if (problems.length > 0) {
      console.warn(`[TalkCraft] "${scenario.id}" content problems:\n - ${problems.join('\n - ')}`);
    }
  }
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <EntitlementsProvider>
        <PracticeProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              // Every screen draws its own header via <Screen>, so the native
              // one is off app-wide to avoid two competing header treatments.
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="scenarios" />
            <Stack.Screen name="practice/[id]" />
            <Stack.Screen name="debrief" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="paywall" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
        </PracticeProvider>
      </EntitlementsProvider>
    </SafeAreaProvider>
  );
}
