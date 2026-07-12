import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../models/models.dart';
import 'package:intl/intl.dart';

class RecruitersListScreen extends StatefulWidget {
  const RecruitersListScreen({super.key});

  @override
  State<RecruitersListScreen> createState() => _RecruitersListScreenState();
}

class _RecruitersListScreenState extends State<RecruitersListScreen> {
  final SupabaseService _supabaseService = SupabaseService();
  final TextEditingController _searchController = TextEditingController();

  List<Recruiter> _recruiters = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadRecruiters();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadRecruiters() async {
    try {
      final data = await _supabaseService.getRecruiters();
      setState(() {
        _recruiters = data;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading recruiters: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _recruiters.where((rec) {
      final name = rec.companyName.toLowerCase();
      final license = (rec.licenseNumber ?? '').toLowerCase();
      return name.contains(_searchQuery) || license.contains(_searchQuery);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: const Text(
          'Verified Recruiters',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Government Licensed Agencies',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Check real-time licensing and complaint logs for agencies in Uganda.',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF94A3B8),
              ),
            ),
            const SizedBox(height: 16),

            // Search bar
            TextField(
              controller: _searchController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search companies, license numbers...',
                hintStyle: const TextStyle(color: Color(0xFF64748B)),
                prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFF334155)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFF334155)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFF38BDF8)),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Recruiters List
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: Color(0xFF38BDF8)),
                    )
                  : filtered.isEmpty
                      ? const Center(
                          child: Text(
                            'No matching recruiters found.',
                            style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
                          ),
                        )
                      : ListView.separated(
                          itemCount: filtered.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final rec = filtered[index];
                            final isActive = rec.status.toLowerCase() == 'active';

                            return Card(
                              color: const Color(0xFF1E293B),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: const BorderSide(color: Color(0xFF334155)),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            rec.companyName,
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: isActive
                                                ? Colors.green.withOpacity(0.15)
                                                : Colors.red.withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(
                                              color: isActive
                                                  ? Colors.green.withOpacity(0.3)
                                                  : Colors.red.withOpacity(0.3),
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(
                                                isActive ? Icons.verified : Icons.warning_amber_rounded,
                                                color: isActive ? Colors.greenAccent : Colors.redAccent,
                                                size: 12,
                                              ),
                                              const SizedBox(width: 4),
                                              Text(
                                                isActive ? 'Verified' : rec.status,
                                                style: TextStyle(
                                                  color: isActive ? Colors.greenAccent : Colors.redAccent,
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),

                                    if (rec.licenseNumber != null) ...[
                                      Text(
                                        'License: ${rec.licenseNumber}',
                                        style: const TextStyle(
                                          fontFamily: 'monospace',
                                          fontSize: 12,
                                          color: Color(0xFF64748B),
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                    ],

                                    const Divider(color: Color(0xFF334155), height: 16),

                                    if (rec.expiryDate != null) ...[
                                      _buildInfoRow(Icons.calendar_today_outlined, 'Valid Until:', _formatExpiryDate(rec.expiryDate!)),
                                      const SizedBox(height: 8),
                                    ],

                                    if (rec.countriesOfOperation.isNotEmpty) ...[
                                      _buildInfoRow(Icons.airplanemode_active, 'Countries:', rec.countriesOfOperation.join(', ')),
                                      const SizedBox(height: 8),
                                    ],

                                    if (rec.companyAddress != null && rec.companyAddress!.isNotEmpty) ...[
                                      _buildInfoRow(Icons.map, 'Address:', rec.companyAddress!),
                                      const SizedBox(height: 8),
                                    ],

                                    if (rec.phone != null && rec.phone!.isNotEmpty) ...[
                                      _buildInfoRow(Icons.phone, 'Phone:', rec.phone!, isLink: true),
                                      const SizedBox(height: 8),
                                    ],

                                    if (rec.email != null && rec.email!.isNotEmpty) ...[
                                      _buildInfoRow(Icons.email, 'Email:', rec.email!, isLink: true),
                                      const SizedBox(height: 8),
                                    ],

                                    if (rec.complaintsCount > 0) ...[
                                      Container(
                                        margin: const EdgeInsets.only(top: 8),
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: Colors.orange.withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: Colors.orange.withOpacity(0.3)),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.warning, color: Colors.orange, size: 16),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                '${rec.complaintsCount} complaint(s) on record for this agency.',
                                                style: const TextStyle(
                                                  color: Colors.orangeAccent,
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatExpiryDate(String raw) {
    try {
      final parsed = DateTime.parse(raw);
      return DateFormat.yMMMMd().format(parsed);
    } catch (_) {
      return raw;
    }
  }

  Widget _buildInfoRow(IconData icon, String label, String value, {bool isLink = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: const Color(0xFF94A3B8), size: 16),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF64748B),
            fontSize: 13,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              color: isLink ? const Color(0xFF38BDF8) : Colors.white,
              fontSize: 13,
              decoration: isLink ? TextDecoration.underline : TextDecoration.none,
            ),
          ),
        ),
      ],
    );
  }
}
