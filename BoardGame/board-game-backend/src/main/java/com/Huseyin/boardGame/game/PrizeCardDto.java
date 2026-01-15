package com.Huseyin.boardGame.game;

public class PrizeCardDto {
    private String code;        // e.g. "MOVE_PLUS_2"
    private String title;       // UI title
    private String description; // UI text
    private String icon;        // optional emoji
    private Long targetUserId;  // optional (block target)
    private Integer value;      // optional (move amount)

    public PrizeCardDto() {}

    public PrizeCardDto(String code, String title, String description, String icon) {
        this.code = code;
        this.title = title;
        this.description = description;
        this.icon = icon;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public Long getTargetUserId() { return targetUserId; }
    public void setTargetUserId(Long targetUserId) { this.targetUserId = targetUserId; }

    public Integer getValue() { return value; }
    public void setValue(Integer value) { this.value = value; }
}
