package rental.map;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;
import java.util.ArrayList;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register the GoogleAuth plugin
        this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
            add(GoogleAuth.class);
        }});

        // Get the WebView instance from Capacitor's Bridge
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            WebSettings webSettings = webView.getSettings();
            // Enable JavaScript and DOM Storage as recommended
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
        }
    }
}
