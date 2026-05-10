package vn.gov.kbnn.vdbas.ltt.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.OffsetDateTime;

/**
 * JPA entity cho bang LTT_ATTACHMENT — chung tu dinh kem.
 */
@Entity
@Table(name = "LTT_ATTACHMENT")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "LTT_ID", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Ltt ltt;

    @Column(name = "FILE_NAME", nullable = false, length = 255)
    private String fileName;

    @Column(name = "FILE_TYPE", nullable = false, length = 10)
    private String fileType;

    @Column(name = "FILE_SIZE", nullable = false)
    private Long fileSize;

    @Column(name = "STORAGE_PATH", length = 500)
    private String storagePath;

    @Column(name = "FILE_HASH", length = 64)
    private String fileHash;

    @Column(name = "DESCRIPTION", length = 500)
    private String description;

    @Column(name = "UPLOADED_BY", nullable = false, length = 50)
    private String uploadedBy;

    @Column(name = "UPLOADED_AT", nullable = false)
    private OffsetDateTime uploadedAt;
}
