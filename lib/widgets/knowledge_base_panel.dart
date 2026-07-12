import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/app_state.dart';
import '../models/models.dart';

class KnowledgeBasePanel extends StatefulWidget {
  const KnowledgeBasePanel({super.key});

  @override
  State<KnowledgeBasePanel> createState() => _KnowledgeBasePanelState();
}

class _KnowledgeBasePanelState extends State<KnowledgeBasePanel> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });

    // Load KB if empty
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = Provider.of<AppState>(context, listen: false);
      if (state.embassies.isEmpty && state.recruiters.isEmpty && state.resources.isEmpty) {
        state.loadKnowledgeBase();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);

    if (state.loadingKb) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: Color(0xFF38BDF8)),
              SizedBox(height: 16),
              Text(
                'Loading knowledge base...',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        // TabBar
        TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF38BDF8),
          unselectedLabelColor: const Color(0xFF94A3B8),
          indicatorColor: const Color(0xFF38BDF8),
          tabs: [
            Tab(text: 'Embassies (${state.embassies.length})'),
            Tab(text: 'Recruiters (${state.recruiters.length})'),
            Tab(text: 'Resources (${state.resources.length})'),
          ],
        ),
        const SizedBox(height: 16),

        // Tab views
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildEmbassiesTab(state.embassies),
              _buildRecruitersTab(state.recruiters),
              _buildResourcesTab(state.resources),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEmbassiesTab(List<Embassy> embassies) {
    if (embassies.isEmpty) {
      return _buildEmptyState('No embassy contacts available.');
    }

    return ListView.separated(
      padding: const EdgeInsets.only(bottom: 24),
      itemCount: embassies.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final emb = embassies[index];
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
                // Country & Name
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      emb.country,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const Icon(Icons.public, color: Color(0xFF38BDF8), size: 20),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  emb.embassyName,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF94A3B8),
                  ),
                ),
                const Divider(color: Color(0xFF334155), height: 24),

                // Primary Phone
                _buildInfoRow(
                  Icons.phone,
                  'Primary:',
                  emb.phonePrimary,
                  color: const Color(0xFF38BDF8),
                  isLink: true,
                ),
                const SizedBox(height: 10),

                // Emergency Phone (SOS)
                if (emb.emergencyHotline != null && emb.emergencyHotline!.isNotEmpty) ...[
                  _buildInfoRow(
                    Icons.warning_amber_rounded,
                    'Emergency Hotline:',
                    emb.emergencyHotline!,
                    color: Colors.redAccent,
                    isLink: true,
                    bold: true,
                  ),
                  const SizedBox(height: 10),
                ],

                // Email
                if (emb.email != null && emb.email!.isNotEmpty) ...[
                  _buildInfoRow(
                    Icons.email_outlined,
                    'Email:',
                    emb.email!,
                    color: const Color(0xFF38BDF8),
                    isLink: true,
                  ),
                  const SizedBox(height: 10),
                ],

                // Address
                if (emb.address != null && emb.address!.isNotEmpty) ...[
                  _buildInfoRow(
                    Icons.map_outlined,
                    'Address:',
                    emb.address!,
                    color: const Color(0xFF94A3B8),
                  ),
                  const SizedBox(height: 10),
                ],

                // Working hours
                if (emb.workingHours != null && emb.workingHours!.isNotEmpty) ...[
                  _buildInfoRow(
                    Icons.access_time,
                    'Working Hours:',
                    emb.workingHours!,
                    color: const Color(0xFF94A3B8),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildRecruitersTab(List<Recruiter> recruiters) {
    final filtered = recruiters.where((r) {
      final name = r.companyName.toLowerCase();
      final license = (r.licenseNumber ?? '').toLowerCase();
      return name.contains(_searchQuery) || license.contains(_searchQuery);
    }).toList();

    return Column(
      children: [
        // Search bar
        TextField(
          controller: _searchController,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'Search companies or license...',
            hintStyle: const TextStyle(color: Color(0xFF64748B)),
            prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8), size: 20),
            filled: true,
            fillColor: const Color(0xFF1E293B),
            contentPadding: const EdgeInsets.symmetric(vertical: 12),
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

        Expanded(
          child: filtered.isEmpty
              ? _buildEmptyState('No matching recruiters found.')
              : ListView.separated(
                  padding: const EdgeInsets.only(bottom: 24),
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
                            // Header
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

                            // License
                            if (rec.licenseNumber != null) ...[
                              Text(
                                'Lic: ${rec.licenseNumber}',
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 12,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                              const SizedBox(height: 10),
                            ],

                            const Divider(color: Color(0xFF334155), height: 16),

                            // Expiry Date
                            if (rec.expiryDate != null) ...[
                              _buildInfoRow(
                                Icons.calendar_today_outlined,
                                'Valid Until:',
                                _formatExpiryDate(rec.expiryDate!),
                                color: const Color(0xFF94A3B8),
                              ),
                              const SizedBox(height: 8),
                            ],

                            // Countries of Operation
                            if (rec.countriesOfOperation.isNotEmpty) ...[
                              _buildInfoRow(
                                Icons.airplanemode_active,
                                'Countries:',
                                rec.countriesOfOperation.join(', '),
                                color: const Color(0xFF94A3B8),
                              ),
                              const SizedBox(height: 8),
                            ],

                            // Contact Address / Phone
                            if (rec.companyAddress != null && rec.companyAddress!.isNotEmpty) ...[
                              _buildInfoRow(
                                Icons.map,
                                'Address:',
                                rec.companyAddress!,
                                color: const Color(0xFF94A3B8),
                              ),
                              const SizedBox(height: 8),
                            ],

                            // Phone
                            if (rec.phone != null && rec.phone!.isNotEmpty) ...[
                              _buildInfoRow(
                                Icons.phone,
                                'Phone:',
                                rec.phone!,
                                color: const Color(0xFF38BDF8),
                                isLink: true,
                              ),
                              const SizedBox(height: 8),
                            ],

                            // Email
                            if (rec.email != null && rec.email!.isNotEmpty) ...[
                              _buildInfoRow(
                                Icons.email,
                                'Email:',
                                rec.email!,
                                color: const Color(0xFF38BDF8),
                                isLink: true,
                              ),
                              const SizedBox(height: 8),
                            ],

                            // Complaints indicator
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
    );
  }

  Widget _buildResourcesTab(List<RightsResource> resources) {
    if (resources.isEmpty) {
      return _buildEmptyState('No safety resources available.');
    }

    return ListView.separated(
      padding: const EdgeInsets.only(bottom: 24),
      itemCount: resources.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final res = resources[index];
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
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        res.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF38BDF8).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF38BDF8).withOpacity(0.3)),
                      ),
                      child: Text(
                        res.category,
                        style: const TextStyle(
                          color: Color(0xFF38BDF8),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  res.content,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFFE2E8F0),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        );
      },
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

  Widget _buildInfoRow(
    IconData icon,
    String label,
    String value, {
    Color color = Colors.white,
    bool isLink = false,
    bool bold = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color, size: 16),
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
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
              decoration: isLink ? TextDecoration.underline : TextDecoration.none,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(String text) {
    return Center(
      child: Text(
        text,
        style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
      ),
    );
  }
}
