import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  const UserEntity({
    required this.id,
    required this.fullName,
    required this.email,
    this.role,
    this.team,
  });

  final int id;
  final String fullName;
  final String email;
  final String? role;
  final String? team;

  @override
  List<Object?> get props => [id, fullName, email, role, team];
}
