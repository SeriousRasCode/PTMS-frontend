import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/core/constants/role_constants.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_bloc.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_event.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_state.dart';

class Login extends StatefulWidget {
  const Login({super.key});

  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    context.read<UserAuthBloc>().add(
      UserLoginSubmitted(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<UserAuthBloc, UserAuthState>(
      listener: (context, state) {
        if (state.status == UserAuthStatus.authenticated) {
          final role = state.user?.role;
          final target = AppRoles.isAdmin(role)
              ? '/dashboard'
              : AppRoles.isManager(role)
                  ? '/dashboard'
                  : '/projects';
          Navigator.of(context).pushNamedAndRemoveUntil(target, (_) => false);
        }

        if (state.status == UserAuthStatus.failure && state.message != null) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(state.message!)));
        }
      },
      builder: (context, state) {
        final isLoading = state.status == UserAuthStatus.loading;
        return Scaffold(
          body: Stack(
            children: [
              Container(
                decoration: const BoxDecoration(
                  gradient: AppColors.brandGradient,
                ),
              ),
              Positioned(
                top: -120,
                right: -80,
                child: Container(
                  height: 220,
                  width: 220,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.14),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              Positioned(
                bottom: -140,
                left: -100,
                child: Container(
                  height: 260,
                  width: 260,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              SafeArea(
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 460),
                      child: Material(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(26),
                        elevation: 10,
                        shadowColor:
                            AppColors.brandPrimary.withValues(alpha: 0.24),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(24, 26, 24, 22),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Center(
                                  child: Column(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 14,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppColors.brandPrimary
                                              .withValues(alpha: 0.12),
                                          borderRadius:
                                              BorderRadius.circular(99),
                                        ),
                                        child: const Text(
                                          'DEBO PTMS',
                                          style: TextStyle(
                                            color: AppColors.brandPrimary,
                                            fontWeight: FontWeight.w600,
                                            letterSpacing: 1.1,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 14),
                                      Container(
                                        width: 110,
                                        height: 110,
                                        padding: const EdgeInsets.all(14),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius:
                                              BorderRadius.circular(26),
                                          boxShadow: [
                                            BoxShadow(
                                              color: AppColors.brandPrimary
                                                  .withValues(alpha: 0.16),
                                              blurRadius: 24,
                                              offset: const Offset(0, 10),
                                            ),
                                          ],
                                        ),
                                        child: ClipRRect(
                                          borderRadius:
                                              BorderRadius.circular(18),
                                          child: Image.asset(
                                            'assets/images/debo_logo.png',
                                            fit: BoxFit.contain,
                                            errorBuilder:
                                                (context, error, stackTrace) {
                                              return const Center(
                                                child: Icon(
                                                  Icons.business,
                                                  size: 50,
                                                  color: AppColors.brandPrimary,
                                                ),
                                              );
                                            },
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 18),
                                Text(
                                  'Welcome back',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleLarge,
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Sign in to continue managing your projects.',
                                  style: TextStyle(color: AppColors.textMuted),
                                ),
                                const SizedBox(height: 22),
                                TextFormField(
                                  controller: _emailController,
                                  decoration: const InputDecoration(
                                    labelText: 'Email',
                                    prefixIcon: Icon(Icons.email_outlined),
                                  ),
                                  keyboardType: TextInputType.emailAddress,
                                  validator: (value) {
                                    if (value == null ||
                                        value.trim().isEmpty) {
                                      return 'Email is required';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 12),
                                TextFormField(
                                  controller: _passwordController,
                                  decoration: const InputDecoration(
                                    labelText: 'Password',
                                    prefixIcon: Icon(Icons.lock_outline),
                                  ),
                                  obscureText: true,
                                  validator: (value) {
                                    if (value == null ||
                                        value.trim().isEmpty) {
                                      return 'Password is required';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 20),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    onPressed: isLoading ? null : _submit,
                                    icon: const Icon(Icons.login),
                                    label: isLoading
                                        ? const SizedBox(
                                            height: 18,
                                            width: 18,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: Colors.white,
                                            ),
                                          )
                                        : const Text('Login'),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Center(
                                  child: TextButton(
                                    onPressed: isLoading
                                        ? null
                                        : () => Navigator.pushNamed(
                                            context,
                                            '/signup',
                                          ),
                                    child: const Text('Create account'),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
