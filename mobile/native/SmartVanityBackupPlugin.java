package ru.smartvanity.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.Plugin;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "SmartVanityBackup")
public class SmartVanityBackupPlugin extends Plugin {
    private static final String BACKUP_TYPE = "application/vnd.smartvanity.backup";

    @PluginMethod
    public void save(PluginCall call) {
        Intent picker = new Intent(Intent.ACTION_CREATE_DOCUMENT)
                .addCategory(Intent.CATEGORY_OPENABLE)
                .setType(BACKUP_TYPE)
                .putExtra(Intent.EXTRA_TITLE, call.getString("filename"));
        try {
            startActivityForResult(call, picker, "saveResult");
        } catch (RuntimeException error) {
            call.reject("Could not open the save dialog", error);
        }
    }

    private JSObject openedBackup(Intent intent) {
        JSObject result = new JSObject();
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction())) return result;
        Uri uri = intent.getData();
        if (uri != null && ("content".equals(uri.getScheme()) || "file".equals(uri.getScheme()))
                && (BACKUP_TYPE.equals(intent.getType())
                    || (uri.getPath() != null && uri.getPath().endsWith(".sv")))) {
            result.put("uri", uri.toString());
        }
        return result;
    }

    @PluginMethod
    public void getLaunchBackup(PluginCall call) {
        call.resolve(openedBackup(getActivity().getIntent()));
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        JSObject result = openedBackup(intent);
        if (result.has("uri")) notifyListeners("backupOpen", result, true);
    }

    @ActivityCallback
    private void saveResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_CANCELED) {
            call.resolve();
            return;
        }
        Intent data = result.getData();
        Uri uri = data == null ? null : data.getData();
        if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
            call.reject("No destination selected");
            return;
        }
        bridge.execute(() -> {
            try (OutputStream stream = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (stream == null) throw new IOException("Could not open backup destination");
                stream.write(call.getString("json", "").getBytes(StandardCharsets.UTF_8));
            } catch (IOException | RuntimeException error) {
                call.reject("Could not save backup", error);
                return;
            }
            call.resolve();
        });
    }
}
