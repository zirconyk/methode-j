package com.methodejapp;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;

public class MainActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        TextView textView = new TextView(this);
        textView.setText("Méthode J - Application en cours de développement");
        textView.setTextSize(18);
        textView.setPadding(50, 50, 50, 50);
        
        setContentView(textView);
    }
}
