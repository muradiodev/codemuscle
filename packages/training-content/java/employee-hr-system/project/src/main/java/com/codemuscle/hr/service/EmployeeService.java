package com.codemuscle.hr.service;

import com.codemuscle.hr.dto.EmployeeCreateRequest;
import com.codemuscle.hr.dto.EmployeeResponse;
import com.codemuscle.hr.model.LeaveRequest;
import java.util.List;
import java.util.Map;

public interface EmployeeService {
    EmployeeResponse create(EmployeeCreateRequest request);
    EmployeeResponse find(String id);
    List<EmployeeResponse> search(String query);
    EmployeeResponse replace(String id, EmployeeCreateRequest request);
    EmployeeResponse changeStatus(String id, com.codemuscle.hr.model.EmployeeStatus status);
    void delete(String id);
    Map<String, Long> countByDepartment();
    LeaveRequest requestLeave(LeaveRequest request);
}
