import 'package:debo_ptms/features/user/domain/entities/user_entity.dart';
import 'package:equatable/equatable.dart';

enum UserAuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  failure,
}

class UserAuthState extends Equatable {
  const UserAuthState({
    this.status = UserAuthStatus.initial,
    this.user,
    this.message,
  });

  final UserAuthStatus status;
  final UserEntity? user;
  final String? message;

  UserAuthState copyWith({
    UserAuthStatus? status,
    UserEntity? user,
    String? message,
    bool clearUser = false,
  }) {
    return UserAuthState(
      status: status ?? this.status,
      user: clearUser ? null : user ?? this.user,
      message: message,
    );
  }

  @override
  List<Object?> get props => [status, user, message];
}
