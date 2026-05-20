package com.kb.ltt.infrastructure.persistence.mapper;

import com.kb.ltt.infrastructure.persistence.entity.AuditLogEntity;
import com.kb.ltt.port.out.AuditLogRepository.AuditLogEntry;
import org.mapstruct.*;

/**
 * MapStruct mapper: AuditLogEntity <-> AuditLogEntry.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AuditLogMapper {

    @Mapping(target = "prevHash", source = "prevHash")
    AuditLogEntity toEntity(AuditLogEntry entry);

    @Mapping(target = "prevHash", source = "prevHash")
    AuditLogEntry toDomain(AuditLogEntity entity);
}
