import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:debo_ptms/core/error/app_exception.dart';
import 'package:debo_ptms/features/user/domain/usecases/get_profile_usecase.dart';
import 'package:debo_ptms/features/user/domain/usecases/login_user_usecase.dart';
import 'package:debo_ptms/features/user/domain/usecases/logout_user_usecase.dart';
import 'package:debo_ptms/features/user/domain/usecases/register_user_usecase.dart';
import 'package:debo_ptms/features/user/domain/usecases/update_profile_usecase.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_event.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_state.dart';

class UserAuthBloc extends Bloc<UserAuthEvent, UserAuthState> {
  UserAuthBloc({
    required LoginUserUseCase loginUserUseCase,
    required RegisterUserUseCase registerUserUseCase,
    required GetProfileUseCase getProfileUseCase,
    required UpdateProfileUseCase updateProfileUseCase,
    required LogoutUserUseCase logoutUserUseCase,
  }) : _loginUserUseCase = loginUserUseCase,
       _registerUserUseCase = registerUserUseCase,
       _getProfileUseCase = getProfileUseCase,
       _updateProfileUseCase = updateProfileUseCase,
       _logoutUserUseCase = logoutUserUseCase,
       super(const UserAuthState()) {
    on<UserAuthStarted>(_onStarted);
    on<UserLoginSubmitted>(_onLoginSubmitted);
    on<UserRegisterSubmitted>(_onRegisterSubmitted);
    on<UserProfileRequested>(_onProfileRequested);
    on<UserProfileUpdateSubmitted>(_onProfileUpdateSubmitted);
    on<UserLogoutRequested>(_onLogoutRequested);
  }

  final LoginUserUseCase _loginUserUseCase;
  final RegisterUserUseCase _registerUserUseCase;
  final GetProfileUseCase _getProfileUseCase;
  final UpdateProfileUseCase _updateProfileUseCase;
  final LogoutUserUseCase _logoutUserUseCase;

  Future<void> _onStarted(
    UserAuthStarted event,
    Emitter<UserAuthState> emit,
  ) async {
    emit(state.copyWith(status: UserAuthStatus.loading, message: null));
    try {
      final user = await _getProfileUseCase();
      emit(
        state.copyWith(
          status: UserAuthStatus.authenticated,
          user: user,
          message: null,
        ),
      );
    } on AppException catch (_) {
      emit(
        state.copyWith(
          status: UserAuthStatus.unauthenticated,
          clearUser: true,
          message: null,
        ),
      );
    } catch (_) {
      emit(
        state.copyWith(
          status: UserAuthStatus.unauthenticated,
          clearUser: true,
          message: null,
        ),
      );
    }
  }

  Future<void> _onLoginSubmitted(
    UserLoginSubmitted event,
    Emitter<UserAuthState> emit,
  ) async {
    emit(state.copyWith(status: UserAuthStatus.loading, message: null));
    try {
      final user = await _loginUserUseCase(
        email: event.email,
        password: event.password,
      );
      emit(
        state.copyWith(
          status: UserAuthStatus.authenticated,
          user: user,
          message: 'Login successful.',
        ),
      );
    } on AppException catch (e) {
      emit(state.copyWith(status: UserAuthStatus.failure, message: e.message));
    } catch (_) {
      emit(
        state.copyWith(
          status: UserAuthStatus.failure,
          message: 'Failed to login. Please try again.',
        ),
      );
    }
  }

  Future<void> _onRegisterSubmitted(
    UserRegisterSubmitted event,
    Emitter<UserAuthState> emit,
  ) async {
    emit(state.copyWith(status: UserAuthStatus.loading, message: null));
    try {
      await _registerUserUseCase(
        fullName: event.fullName,
        email: event.email,
        password: event.password,
        roleId: event.roleId,
      );

      // Registration does not imply the user is logged in.
      // Move the user back to Login so they can authenticate.
      emit(
        state.copyWith(
          status: UserAuthStatus.unauthenticated,
          clearUser: true,
          message: 'Registration successful. Please login.',
        ),
      );
    } on AppException catch (e) {
      emit(state.copyWith(status: UserAuthStatus.failure, message: e.message));
    } catch (_) {
      emit(
        state.copyWith(
          status: UserAuthStatus.failure,
          message: 'Failed to register. Please try again.',
        ),
      );
    }
  }

  Future<void> _onProfileRequested(
    UserProfileRequested event,
    Emitter<UserAuthState> emit,
  ) async {
    emit(state.copyWith(status: UserAuthStatus.loading, message: null));
    try {
      final user = await _getProfileUseCase();
      emit(
        state.copyWith(
          status: UserAuthStatus.authenticated,
          user: user,
          message: null,
        ),
      );
    } on AppException catch (e) {
      emit(state.copyWith(status: UserAuthStatus.failure, message: e.message));
    } catch (_) {
      emit(
        state.copyWith(
          status: UserAuthStatus.failure,
          message: 'Failed to load profile.',
        ),
      );
    }
  }

  Future<void> _onProfileUpdateSubmitted(
    UserProfileUpdateSubmitted event,
    Emitter<UserAuthState> emit,
  ) async {
    emit(state.copyWith(status: UserAuthStatus.loading, message: null));
    try {
      final user = await _updateProfileUseCase(
        fullName: event.fullName,
        email: event.email,
      );
      emit(
        state.copyWith(
          status: UserAuthStatus.authenticated,
          user: user,
          message: 'Profile updated successfully.',
        ),
      );
    } on AppException catch (e) {
      emit(state.copyWith(status: UserAuthStatus.failure, message: e.message));
    } catch (_) {
      emit(
        state.copyWith(
          status: UserAuthStatus.failure,
          message: 'Failed to update profile.',
        ),
      );
    }
  }

  Future<void> _onLogoutRequested(
    UserLogoutRequested event,
    Emitter<UserAuthState> emit,
  ) async {
    await _logoutUserUseCase();
    emit(
      state.copyWith(
        status: UserAuthStatus.unauthenticated,
        clearUser: true,
        message: 'Logged out.',
      ),
    );
  }
}
