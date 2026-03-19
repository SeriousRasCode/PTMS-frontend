import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/features/tasks/data/datasources/tasks_remote_data_source.dart';
import 'package:debo_ptms/features/tasks/data/repositories/tasks_repository_impl.dart';
import 'package:debo_ptms/features/tasks/domain/entities/task_entity.dart';
import 'package:debo_ptms/features/tasks/domain/usecases/get_my_tasks_usecase.dart';
import 'package:debo_ptms/features/tasks/presentation/pages/task_details_page.dart';
import 'package:debo_ptms/shared/widgets/app_drawer.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class MyTasksScreen extends StatefulWidget {
  const MyTasksScreen({super.key});

  @override
  State<MyTasksScreen> createState() => _MyTasksScreenState();
}

class _MyTasksScreenState extends State<MyTasksScreen> {
  bool _loading = true;
  String? _error;
  List<TaskEntity> _tasks = const [];

  void _showNotifications() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('No new notifications right now.')),
    );
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final apiClient = context.read<ApiClient>();
      final useCase = GetMyTasksUseCase(
        TasksRepositoryImpl(TasksRemoteDataSourceImpl(apiClient)),
      );

      _tasks = await useCase();
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: const Text('My Tasks'),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        ),
        actions: [
          IconButton(
            onPressed: _showNotifications,
            icon: const Icon(Icons.notifications_none_rounded),
            tooltip: 'Notifications',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_error!, textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _load,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: _tasks.isEmpty
                  ? ListView(
                      padding: const EdgeInsets.all(16),
                      children: const [
                        Card(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: Text('No tasks assigned yet.'),
                          ),
                        ),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _tasks.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final t = _tasks[index];
                        final taskId = t.id;
                        final title = t.title;
                        final status = t.status;
                        final progress = t.progress;
                        final projectName = t.projectName;
                        final value = (progress.clamp(0, 100)) / 100;

                        final progressColor = progress >= 100
                            ? Colors.green
                            : (progress > 0 ? AppColors.brandPrimary : Colors.grey);

                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(
                                    title.isEmpty ? 'Task #$taskId' : title,
                                  ),
                                  subtitle: Text(
                                    [
                                      if (projectName.isNotEmpty) projectName,
                                      'Status: $status',
                                      'Progress: $progress%',
                                    ].join(' • '),
                                  ),
                                  trailing: const Icon(Icons.chevron_right),
                                  onTap: () async {
                                    await Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) => TaskDetailsScreen(
                                          taskId: taskId,
                                          initialTitle: title,
                                          initialStatus: status,
                                          initialProgress: progress,
                                        ),
                                      ),
                                    );
                                    _load();
                                  },
                                ),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(99),
                                  child: LinearProgressIndicator(
                                    value: value.toDouble(),
                                    minHeight: 8,
                                    color: progressColor,
                                    backgroundColor: Colors.grey.shade300,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
