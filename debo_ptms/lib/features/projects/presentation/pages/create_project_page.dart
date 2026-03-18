import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
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
  final _teamId = TextEditingController();
  DateTime? _start;
  DateTime? _end;

  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _teamId.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isStart}) async {
    final initial = isStart ? (_start ?? DateTime.now()) : (_end ?? DateTime.now());
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

    final teamId = int.tryParse(_teamId.text.trim());
    if (teamId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Team ID must be a number.')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final apiClient = context.read<ApiClient>();
      final useCase = CreateProjectUseCase(
        ProjectsRepositoryImpl(
          ProjectsRemoteDataSourceImpl(apiClient),
        ),
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
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
                TextFormField(
                  controller: _teamId,
                  decoration: const InputDecoration(labelText: 'Team ID'),
                  keyboardType: TextInputType.number,
                  validator: (v) => _required(v, 'Team ID'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _description,
                  decoration: const InputDecoration(labelText: 'Description (optional)'),
                  minLines: 2,
                  maxLines: 4,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _saving ? null : () => _pickDate(isStart: true),
                        child: Text(_start == null ? 'Start Date' : _fmtDate(_start!)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _saving ? null : () => _pickDate(isStart: false),
                        child: Text(_end == null ? 'End Date' : _fmtDate(_end!)),
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
