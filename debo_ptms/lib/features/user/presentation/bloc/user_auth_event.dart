import 'package:equatable/equatable.dart';

abstract class UserAuthEvent extends Equatable {
  const UserAuthEvent();

  @override
  List<Object?> get props => [];
}

class UserAuthStarted extends UserAuthEvent {
  const UserAuthStarted();
}

class UserLoginSubmitted extends UserAuthEvent {
  const UserLoginSubmitted({required this.email, required this.password});

  final String email;
  final String password;

  @override
  List<Object?> get props => [email, password];
}

class UserRegisterSubmitted extends UserAuthEvent {
  const UserRegisterSubmitted({
    required this.fullName,
    required this.email,
    required this.password,
    required this.roleId,
  });

  final String fullName;
  final String email;
  final String password;
  final int roleId;

  @override
  List<Object?> get props => [fullName, email, password, roleId];
}

class UserProfileRequested extends UserAuthEvent {
  const UserProfileRequested();
}

class UserProfileUpdateSubmitted extends UserAuthEvent {
  const UserProfileUpdateSubmitted({
    required this.fullName,
    required this.email,
  });

  final String fullName;
  final String email;

  @override
  List<Object?> get props => [fullName, email];
}

class UserLogoutRequested extends UserAuthEvent {
  const UserLogoutRequested();
}
