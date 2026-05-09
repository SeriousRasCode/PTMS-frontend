import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/features/home/data/datasources/home_remote_data_source.dart';
import 'package:debo_ptms/features/home/data/repositories/home_repository_impl.dart';
import 'package:debo_ptms/features/home/domain/entities/home_team_entity.dart';
import 'package:debo_ptms/features/home/domain/usecases/get_my_teams_usecase.dart';
import 'package:debo_ptms/features/projects/data/datasources/projects_remote_data_source.dart';
import 'package:debo_ptms/features/projects/data/repositories/projects_repository_impl.dart';
import 'package:debo_ptms/features/projects/domain/entities/create_project_input.dart';
import 'package:debo_ptms/features/projects/domain/usecases/create_project_usecase.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class CreateProjectScreen extends StatefulWidget {
  const CreateProjectScreen({super.key});

  @override
  State<CreateProjectScreen> createState() => _CreateProjectScreenState();
}

class _CreateProjectScreenState extends State<CreateProjectScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _description = TextEditingController();
  List<HomeTeamEntity> _teams = const [];
  int? _selectedTeamId;
  bool _loadingTeams = true;
  DateTime? _start;
  DateTime? _end;

  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadTeams();
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _loadTeams() async {
    setState(() => _loadingTeams = true);
    try {
      final apiClient = context.read<ApiClient>();
      final useCase = GetMyTeamsUseCase(
        HomeRepositoryImpl(HomeRemoteDataSourceImpl(apiClient)),
      );
      final teams = await useCase();
      if (!mounted) return;
      setState(() {
        _teams = teams;
        if (_selectedTeamId == null && teams.isNotEmpty) {
          _selectedTeamId = teams.first.id;
        }
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _teams = const []);
    } finally {
      if (mounted) {
        setState(() => _loadingTeams = false);
      }
    }
  }

  Future<void> _pickDate({required bool isStart}) async {
    final initial = isStart
        ? (_start ?? DateTime.now())
        : (_end ?? DateTime.now());
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _start = picked;
      } else {
        _end = picked;
      }
    });
  }

  String? _required(String? v, String label) {
    if (v == null || v.trim().isEmpty) return '$label is required';
    return null;
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final teamId = _selectedTeamId;
    if (teamId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please select a team.')));
      return;
    }

    setState(() => _saving = true);
    try {
      final apiClient = context.read<ApiClient>();
      final useCase = CreateProjectUseCase(
        ProjectsRepositoryImpl(ProjectsRemoteDataSourceImpl(apiClient)),
      );
      await useCase(
        CreateProjectInput(
          name: _name.text.trim(),
          description: _description.text.trim(),
          teamId: teamId,
          startDate: _start,
          endDate: _end,
        ),
      );

      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  String _fmtDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Project'),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Project Name'),
                  validator: (v) => _required(v, 'Project name'),
                ),
                const SizedBox(height: 12),
                if (_loadingTeams)
                  const LinearProgressIndicator(minHeight: 2)
                else
                  DropdownButtonFormField<int>(
                    initialValue: _selectedTeamId,
                    decoration: const InputDecoration(labelText: 'Team'),
                    items: _teams
                        .map(
                          (team) => DropdownMenuItem<int>(
                            value: team.id,
                            child: Text(
                              team.name.isEmpty
                                  ? 'Team #${team.id}'
                                  : team.name,
                            ),
                          ),
                        )
                        .toList(growable: false),
                    validator: (value) =>
                        value == null ? 'Team is required' : null,
                    onChanged: _saving
                        ? null
                        : (value) => setState(() => _selectedTeamId = value),
                  ),
                if (!_loadingTeams && _teams.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Text(
                      'No teams available. Ask admin to add you to a team.',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _description,
                  decoration: const InputDecoration(
                    labelText: 'Description (optional)',
                  ),
                  minLines: 2,
                  maxLines: 4,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _saving
                            ? null
                            : () => _pickDate(isStart: true),
                        child: Text(
                          _start == null ? 'Start Date' : _fmtDate(_start!),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _saving
                            ? null
                            : () => _pickDate(isStart: false),
                        child: Text(
                          _end == null ? 'End Date' : _fmtDate(_end!),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _submit,
                    child: _saving
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Create'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
