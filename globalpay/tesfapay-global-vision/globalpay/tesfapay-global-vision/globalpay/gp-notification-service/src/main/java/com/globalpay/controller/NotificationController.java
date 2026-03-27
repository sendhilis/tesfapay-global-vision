package com.globalpay.controller;

import com.globalpay.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController @RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notifService;

    @GetMapping("/notifications")
    public ResponseEntity<?> get(HttpServletRequest req,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(notifService.getNotifications(uid(req), unreadOnly, page, size));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable UUID id) {
        notifService.markRead(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<Void> markAllRead(HttpServletRequest req) {
        notifService.markAllRead(uid(req));
        return ResponseEntity.noContent().build();
    }

    private UUID uid(HttpServletRequest req) {
        return UUID.fromString(req.getAttribute("userId").toString());
    }
}
