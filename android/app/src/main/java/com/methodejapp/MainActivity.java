package com.methodejapp;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import android.graphics.Color;
import android.graphics.Typeface;
import android.view.Gravity;
import android.widget.Toast;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Create main layout
        LinearLayout mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setBackgroundColor(Color.parseColor("#0D1B2A"));
        mainLayout.setPadding(40, 80, 40, 40);
        mainLayout.setGravity(Gravity.CENTER_HORIZONTAL);
        
        // App Icon (emoji)
        TextView iconView = new TextView(this);
        iconView.setText("🧠");
        iconView.setTextSize(60);
        iconView.setGravity(Gravity.CENTER);
        iconView.setPadding(0, 0, 0, 30);
        
        // Title
        TextView titleView = new TextView(this);
        titleView.setText("Méthode J");
        titleView.setTextSize(32);
        titleView.setTextColor(Color.parseColor("#4FC3F7"));
        titleView.setTypeface(null, Typeface.BOLD);
        titleView.setGravity(Gravity.CENTER);
        titleView.setPadding(0, 0, 0, 10);
        
        // Subtitle
        TextView subtitleView = new TextView(this);
        subtitleView.setText("Révision Espacée pour Pharmacie");
        subtitleView.setTextSize(18);
        subtitleView.setTextColor(Color.parseColor("#81C784"));
        subtitleView.setGravity(Gravity.CENTER);
        subtitleView.setPadding(0, 0, 0, 40);
        
        // Description
        TextView descView = new TextView(this);
        descView.setText("🎯 Algorithme de révision espacée\n" +
                        "📚 Optimisé pour les études de pharmacie\n" +
                        "⚡ Coefficients exponentiels adaptatifs\n" +
                        "🏆 Système de gamification intégré");
        descView.setTextSize(16);
        descView.setTextColor(Color.parseColor("#E0E0E0"));
        descView.setGravity(Gravity.CENTER);
        descView.setPadding(20, 0, 20, 40);
        descView.setLineSpacing(8, 1);
        
        // Features list
        TextView featuresView = new TextView(this);
        featuresView.setText("✨ Fonctionnalités principales :\n\n" +
                           "• Seuil d'élimination : 9/20\n" +
                           "• Seuil de base : 12/20\n" +
                           "• 30+ couleurs pour les UE\n" +
                           "• Export/Import JSON & CSV\n" +
                           "• Mode sombre par défaut");
        featuresView.setTextSize(14);
        featuresView.setTextColor(Color.parseColor("#B0BEC5"));
        featuresView.setPadding(20, 0, 20, 40);
        featuresView.setLineSpacing(6, 1);
        
        // Version info
        TextView versionView = new TextView(this);
        versionView.setText("Version 1.0 - Build de démonstration");
        versionView.setTextSize(12);
        versionView.setTextColor(Color.parseColor("#607D8B"));
        versionView.setGravity(Gravity.CENTER);
        versionView.setPadding(0, 20, 0, 20);
        
        // Demo button
        Button demoButton = new Button(this);
        demoButton.setText("🚀 Démarrer la démo");
        demoButton.setTextSize(16);
        demoButton.setTextColor(Color.WHITE);
        demoButton.setBackgroundColor(Color.parseColor("#2E7D32"));
        demoButton.setPadding(40, 20, 40, 20);
        demoButton.setOnClickListener(v -> {
            Toast.makeText(this, "Fonctionnalité en développement !\n\nL'application complète sera bientôt disponible.", Toast.LENGTH_LONG).show();
        });
        
        // Add all views to layout
        mainLayout.addView(iconView);
        mainLayout.addView(titleView);
        mainLayout.addView(subtitleView);
        mainLayout.addView(descView);
        mainLayout.addView(featuresView);
        mainLayout.addView(versionView);
        mainLayout.addView(demoButton);
        
        setContentView(mainLayout);
    }
}