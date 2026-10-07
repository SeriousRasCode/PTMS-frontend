import 'package:debo_ptms/core/constants/api_constants.dart';
import 'package:debo_ptms/core/error/app_exception.dart';
import 'package:debo_ptms/core/storage/token_storage.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class ApiClient {
  ApiClient({required TokenStorage tokenStorage})
    : _tokenStorage = tokenStorage,
      _dio = Dio(
        BaseOptions(
          baseUrl: ApiConstants.baseUrl,
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 20),
          headers: const {'Content-Type': 'application/json'},
        ),
      ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStorage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  final Dio _dio;
  final TokenStorage _tokenStorage;

  Future<Map<String, dynamic>> get(String path) async {
    try {
      final response = await _dio.get<dynamic>(path);
      return _asMap(response.data);
    } on DioException catch (e) {
      throw _mapException(e);
    }
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    try {
      final response = await _dio.post<dynamic>(path, data: body);
      return _asMap(response.data);
    } on DioException catch (e) {
      throw _mapException(e);
    }
  }

  Future<Map<String, dynamic>> put(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    try {
      final response = await _dio.put<dynamic>(path, data: body);
      return _asMap(response.data);
    } on DioException catch (e) {
      throw _mapException(e);
    }
  }

  Future<Map<String, dynamic>> patch(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    try {
      final response = await _dio.patch<dynamic>(path, data: body);
      return _asMap(response.data);
    } on DioException catch (e) {
      throw _mapException(e);
    }
  }

  Map<String, dynamic> _asMap(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      return payload;
    }
    return <String, dynamic>{'data': payload};
  }

  AppException _mapException(DioException error) {
    final responseData = error.response?.data;
    String message = 'Something went wrong.';
    final statusCode = error.response?.statusCode;

    // On Flutter Web, many network failures surface as an opaque XHR onError.
    // Common causes: backend not running, wrong baseUrl/port, or CORS blocked.
    if (kIsWeb && error.type == DioExceptionType.connectionError) {
      message =
          'Network error contacting the API at ${ApiConstants.baseUrl}. '
          'If you are running Flutter Web, this is often caused by the backend '
          'not running on that URL/port or by CORS blocking the request.';
      return AppException(message, statusCode: statusCode);
    }

    if (responseData is Map<String, dynamic>) {
      message = (responseData['message'] ?? responseData['error'] ?? message)
          .toString();
    } else if (responseData is String && responseData.trim().isNotEmpty) {
      message = _normalizeBackendError(responseData);
    } else if (error.message != null && error.message!.isNotEmpty) {
      message = error.message!;
    }

    final lowerMessage = message.toLowerCase();
    if (lowerMessage.contains('email already exists')) {
      message = 'This email is already registered. Please login instead.';
    }
    if (lowerMessage.contains('invalid role_id') ||
        (lowerMessage.contains('invalid') && lowerMessage.contains('role'))) {
      message =
          'Invalid role selected. Try Role ID 1 (Admin), 2 (Project Manager), or 3 (Team Member).';
    }

    if (statusCode == 403 ||
        lowerMessage.contains('forbidden') ||
        lowerMessage.contains('permission')) {
      message = 'This action is unavailable in your current workspace view.';
    }

    // Friendly auth error messaging.
    if (statusCode == 401) {
      if (lowerMessage.contains('unauthorized') ||
          lowerMessage.contains('invalid credentials') ||
          lowerMessage.contains('invalid password') ||
          lowerMessage.contains('invalid email') ||
          lowerMessage.contains('wrong password')) {
        message = 'Invalid email or password.';
      }
    }

    return AppException(message, statusCode: statusCode);
  }

  String _normalizeBackendError(String raw) {
    final trimmed = raw.trim();

    // If the backend sends an HTML error page, strip it down.
    final looksLikeHtml = trimmed.startsWith('<!DOCTYPE') ||
        trimmed.startsWith('<html') ||
        trimmed.contains('<body') ||
        trimmed.contains('<pre>');

    final text = looksLikeHtml ? _stripHtml(trimmed) : trimmed;

    // Common DB errors -> user-friendly messages.
    final lower = text.toLowerCase();
    if (lower.contains('duplicate entry') && lower.contains('users.email')) {
      return 'This email is already registered. Please login instead.';
    }
    if (lower.contains('foreign key constraint fails') &&
        lower.contains('user_roles') &&
        lower.contains('role')) {
      return 'Invalid role selected. Try Role ID 1 (Admin), 2 (Project Manager), or 3 (Team Member).';
    }

    // Fallback: keep it short.
    return text.isEmpty ? 'Request failed. Please try again.' : text;
  }

  String _stripHtml(String input) {
    // Basic tag stripping + entity decoding for the common cases we see.
    var out = input
        .replaceAll(RegExp(r'<\s*br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'<[^>]+>'), '')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&#39;', "'")
        .replaceAll('&quot;', '"')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>');

    out = out.replaceAll(RegExp(r'\n{3,}'), '\n\n').trim();

    // Remove noisy stack traces if present.
    final stackIndex = out.indexOf('at ');
    if (stackIndex >= 0) {
      out = out.substring(0, stackIndex).trim();
    }

    return out;
  }
}
