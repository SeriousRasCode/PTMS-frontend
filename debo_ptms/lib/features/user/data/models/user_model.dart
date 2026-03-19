import 'package:debo_ptms/features/user/domain/entities/user_entity.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.fullName,
    required super.email,
    super.role,
    super.team,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final roleValue = json['role'];
    final teamValue = json['team'];
    final rolesValue = json['roles'];

    String? roleFromList;
    if (rolesValue is List && rolesValue.isNotEmpty) {
      final first = rolesValue.first;
      if (first != null && first.toString().isNotEmpty) {
        roleFromList = first.toString();
      }
    }

    return UserModel(
      id: _readInt(json['id']) ?? 0,
      fullName: (json['full_name'] ?? json['fullName'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role:
          _readNestedName(roleValue) ??
          (json['role_name']?.toString()) ??
          roleFromList,
      team: _readNestedName(teamValue) ?? (json['team_name']?.toString()),
    );
  }

  static int? _readInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '');
  }

  static String? _readNestedName(dynamic value) {
    if (value is String) return value;
    if (value is Map<String, dynamic>) {
      return (value['name'] ?? value['title'])?.toString();
    }
    return null;
  }
}
