<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Payroll;
use App\Models\AttendanceLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class PayrollController extends Controller
{
    public function index()
    {
        $payrolls = Payroll::with('user')->orderBy('created_at', 'desc')->get();
        return Inertia::render('Admin/Payrolls/Index', ['payrolls' => $payrolls]);
    }

    public function create()
    {
        $employees = User::where('is_employee', true)->get();
        return Inertia::render('Admin/Payrolls/Create', ['employees' => $employees]);
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:users,id',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
        ]);

        $employee = User::find($validated['employee_id']);
        $periodStart = Carbon::parse($validated['period_start']);
        $periodEnd = Carbon::parse($validated['period_end']);

        // Get attendance logs within period where both time_in and time_out are set
        $logs = AttendanceLog::where('user_id', $employee->id)
            ->whereBetween('time_in', [$periodStart, $periodEnd])
            ->whereNotNull('time_out')
            ->get();

        $totalDays = $logs->count();
        $totalOvertimeMinutes = $logs->sum('overtime_minutes');
        $totalLateMinutes = $logs->sum('late_minutes');

        // Compute pay
        $dailyRate = $employee->daily_rate ?? 0;
        $basicSalary = $totalDays * $dailyRate;
        $overtimePay = ($totalOvertimeMinutes / 60) * ($dailyRate / 8) * 1.25; // 25% premium
        $deductions = ($totalLateMinutes / 60) * ($dailyRate / 8); // deduct late time

        $grossSalary = $basicSalary + $overtimePay;
        $netSalary = $grossSalary - $deductions;

        // Create payroll record
        $payroll = Payroll::create([
            'user_id' => $employee->id,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'total_days_worked' => $totalDays,
            'total_hours_worked' => $logs->sum('work_duration') / 60 ?? 0,
            'daily_rate' => $dailyRate,
            'basic_salary' => $basicSalary,
            'overtime_pay' => $overtimePay,
            'deductions' => $deductions,
            'gross_salary' => $grossSalary,
            'net_salary' => $netSalary,
            'status' => 'pending',
        ]);

        return redirect()->route('admin.payrolls.index')->with('success', 'Payroll generated.');
    }

    public function show(Payroll $payroll)
    {
        $payroll->load('user');
        return Inertia::render('Admin/Payrolls/Show', ['payroll' => $payroll]);
    }

    public function approve(Payroll $payroll)
    {
        $payroll->status = 'approved';
        $payroll->save();
        return redirect()->back()->with('success', 'Payroll approved.');
    }

    public function markPaid(Payroll $payroll)
    {
        $payroll->status = 'paid';
        $payroll->paid_at = now();
        $payroll->save();
        return redirect()->back()->with('success', 'Payroll marked as paid.');
    }
}
