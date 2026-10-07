import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/core/constants/role_constants.dart';
import 'package:debo_ptms/features/tasks/data/datasources/tasks_remote_data_source.dart';
import 'package:debo_ptms/features/tasks/data/repositories/tasks_repository_impl.dart';
import 'package:debo_ptms/features/tasks/domain/entities/task_history_entity.dart';
import 'package:debo_ptms/features/tasks/domain/entities/task_progress_update_input.dart';
import 'package:debo_ptms/features/tasks/domain/usecases/assign_task_usecase.dart';
import 'package:debo_ptms/features/tasks/domain/usecases/get_task_history_usecase.dart';
import 'package:debo_ptms/features/tasks/domain/usecases/update_task_progress_usecase.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class TaskDetailsScreen extends StatefulWidget {
  const TaskDetailsScreen({
    super.key,
    required this.taskId,
    required this.initialTitle,
    required this.initialStatus,
    required this.initialProgress,
  });

  final int taskId;
  final String initialTitle;
  final String initialStatus;
  final int initialProgress;

  @override
  State<TaskDetailsScreen> createState() => _TaskDetailsScreenState();
}

class _TaskDetailsScreenState extends State<TaskDetailsScreen> {
  bool _saving = false;
  int _progress = 0;
  final _note = TextEditingController();
  final _assignUserId = TextEditingController();

  bool _loadingHistory = false;
  List<TaskHistoryEntity> _history = const [];

  @override
  void initState() {
    super.initState();
    _progress = widget.initialProgress.clamp(0, 100);
    _loadHistoryIfAllowed();
  }

  @override
  void dispose() {
    _note.dispose();
    _assignUserId.dispose();
    super.dispose();
  }

  Future<void> _loadHistoryIfAllowed() async {
    final role = context.read<UserAuthBloc>().state.user?.role;
    if (!AppRoles.isMember(role)) return;

    setState(() {
      _loadingHistory = true;
      _history = const [];
    });

    try {
      final apiClient = context.read<ApiClient>();
      final useCase = GetTaskHistoryUseCase(
        TasksRepositoryImpl(
          TasksRemoteDataSourceImpl(apiClient),
        ),
      );
      _history = await useCase(taskId: widget.taskId);
    } catch (_) {
      // History is optional; don't block UI.
    } finally {
      if (mounted) {
        setState(() => _loadingHistory = false);
      }
    }
  }

  Future<void> _updateProgress() async {
    setState(() => _saving = true);
    try {
      final apiClient = context.read<ApiClient>();
      final useCase = UpdateTaskProgressUseCase(
        TasksRepositoryImpl(
          TasksRemoteDataSourceImpl(apiClient),
        ),
      );
      await useCase(
        TaskProgressUpdateInput(
          taskId: widget.taskId,
          progress: _progress,
          note: _note.text.trim(),
        ),
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Progress updated.')),
      );
      _note.clear();
      _loadHistoryIfAllowed();
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  Future<void> _assignTask() async {
    final userId = int.tryParse(_assignUserId.text.trim());
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid User ID.')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final apiClient = context.read<ApiClient>();
      final useCase = AssignTaskUseCase(
        TasksRepositoryImpl(
          TasksRemoteDataSourceImpl(apiClient),
        ),
      );
      await useCase(taskId: widget.taskId, userId: userId);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Task assigned.')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserAuthBloc b) => b.state.user?.role);
    final canUpdateProgress = AppRoles.isMember(role);
    final canAssign = AppRoles.isAdmin(role) || AppRoles.isManager(role);

    final status = _progress == 0
        ? 'not_started'
        : (_progress == 100 ? 'completed' : 'started');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Task Details'),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.initialTitle.isEmpty
                          ? 'Task #${widget.taskId}'
                          : widget.initialTitle,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text('Current status: $status'),
                    const SizedBox(height: 8),
                    Text('Progress: $_progress%'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            if (canUpdateProgress) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Update Progress',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      Slider(
                        value: _progress.toDouble(),
                        min: 0,
                        max: 100,
                        divisions: 20,
                        label: '$_progress%',
                        onChanged: _saving
                            ? null
                            : (v) => setState(() => _progress = v.round()),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _note,
                        decoration: const InputDecoration(
                          labelText: 'Update note (optional)',
                        ),
                        minLines: 1,
                        maxLines: 3,
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _saving ? null : _updateProgress,
                          child: _saving
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Save Progress'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Progress History',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      if (_loadingHistory)
                        const Center(child: CircularProgressIndicator())
                      else if (_history.isEmpty)
                        const Text('No updates yet.')
                      else
                        Column(
                          children: _history.map((h) {
                            final pct = h.progress.toString();
                            final st = h.status;
                            final note = h.note;
                            final by = h.updatedBy;
                            final at = h.updatedAt;
                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text('$pct% • $st'),
                              subtitle: Text([
                                if (note.isNotEmpty) note,
                                if (by.isNotEmpty) 'Updated by: $by',
                                if (at.isNotEmpty) at,
                              ].join('\n')),
                            );
                          }).toList(growable: false),
                        ),
                    ],
                  ),
                ),
              ),
            ],
            if (canAssign) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Assign Task',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _assignUserId,
                        decoration: const InputDecoration(
                          labelText: 'User ID',
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _saving ? null : _assignTask,
                          child: _saving
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Assign'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
