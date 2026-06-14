import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const icon =
  (name: IconName) =>
  ({ color, size }: { color: string; size: number }) =>
    <MaterialCommunityIcons name={name} size={size} color={color} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg, shadowColor: 'transparent', elevation: 0 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800', letterSpacing: -0.3, fontSize: 20 },
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
      }}
    >
      <Tabs.Screen name="today" options={{ title: 'Today', tabBarIcon: icon('calendar-today') }} />
      <Tabs.Screen name="program" options={{ title: 'Program', tabBarIcon: icon('dumbbell') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('finance') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('account') }} />
    </Tabs>
  );
}
