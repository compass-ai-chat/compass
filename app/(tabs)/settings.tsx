import { View, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { syncToPolarisAtom } from "@/src/hooks/atoms";
import { useAtom } from "jotai";
import { useLocalization } from "@/src/hooks/useLocalization";
import { SettingItem } from "@/src/components/settings/SettingItem";

export default function SettingsScreen() {
  const [syncToPolaris, setSyncToPolaris] = useAtom(syncToPolarisAtom);
  const { t } = useLocalization();

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="mb-6">
        <View className="flex-row items-center p-4">
          <Ionicons name="cog" size={32} className="!text-primary mr-2 pb-2" />
          <Text className="text-2xl font-bold text-primary">{t('settings.settings')}</Text>
        </View>
        <Text className="text-secondary">{t('settings.customize_experience')}</Text>
      </View>

      <View className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
        <SettingItem
          title={t('settings.font_settings.title')}
          description={t('settings.font_settings.description')}
          icon="text"
          onPress={() => router.push("/settings/font")}
        />

        <SettingItem
          title={t('settings.providers.title')}
          description={t('settings.providers.description')}
          icon="git-branch"
          onPress={() => router.push("/settings/providers")}
        />

        <SettingItem
          title={t('settings.tools.title')}
          description={t('settings.tools.description')}
          icon="construct"
          onPress={() => router.push("/settings/tools")}
        />

        {!syncToPolaris && (
          <SettingItem
            title={t('settings.theme.title')}
            description={t('settings.theme.description')}
            icon="color-palette"
            onPress={() => router.push("/settings/theme")}
          />
        )}

        <SettingItem
          title={t('settings.logs.title')}
          description={t('settings.logs.description')}
          icon="list"
          onPress={() => router.push("/settings/logs")}
        />

        <SettingItem
          title={t('settings.general.title')}
          description={t('settings.general.description')}
          icon="settings"
          onPress={() => router.push("/settings/general")}
        />

        <SettingItem
          title={t('settings.export.title')}
          description={t('settings.export.description')}
          icon="download"
          onPress={() => router.push("/settings/export")}
        />

        <SettingItem
          title={t('settings.help.title')}
          description={t('settings.help.description')}
          icon="help-circle"
          onPress={() => router.push("/settings/help")}
        />

        <SettingItem
          title={t('settings.polaris.title')}
          description={t('settings.polaris.description')}
          icon="sparkles"
          onPress={() => router.push("/settings/polaris")}
        />
        {/* <SettingItem
          title={t('settings.about.title')}
          description={t('settings.about.description')}
          icon="information-circle"
          onPress={() => router.push('/settings/about')}
        /> */}
      </View>
    </ScrollView>
  );
}
