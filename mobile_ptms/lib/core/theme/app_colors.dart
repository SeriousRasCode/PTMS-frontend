import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color brandPrimary = Color(0xFF0C4F79);
  static const Color brandSecondary = Color(0xFF176D8D);
  static const Color brandAccent = Color(0xFF4FA7C3);
  static const Color surfaceSoft = Color(0xFFF3F8FC);
  static const Color textPrimary = Color(0xFF0A2436);
  static const Color textMuted = Color(0xFF567387);

  static const LinearGradient brandGradient = LinearGradient(
    colors: [brandPrimary, brandSecondary],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
